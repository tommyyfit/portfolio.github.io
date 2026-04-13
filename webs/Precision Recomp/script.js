document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const STORAGE_KEY = 'premium_recomp_coach_v1';
  const KG_PER_LB = 0.45359237;

  const state = {
    unit: 'kg',
    macroChart: null,
    projectionChart: null,
    lastResult: null,
  };

  const $ = (id) => document.getElementById(id);

  const DOM = {
    form: $('recomp-form'),
    btnCalc: $('btn-calc'),
    btnReset: $('btn-reset'),
    idleScreen: $('idle-screen'),
    warningBanner: $('warning-banner'),
    resultsBody: $('results-body'),
    statusBadge: $('status-badge'),
    rMeta: $('r-meta'),
    verdictTitle: $('verdict-title'),
    verdictCopy: $('verdict-copy'),
    rBMR: $('r-bmr'),
    rTDEE: $('r-tdee'),
    rBF: $('r-bf'),
    rLBM: $('r-lbm'),
    rMuscle: $('r-muscle'),
    rFat: $('r-fat'),
    rNet: $('r-net'),
    barMuscle: $('bar-muscle'),
    barFat: $('bar-fat'),
    barNet: $('bar-net'),
    mProtein: $('m-protein'),
    mFat: $('m-fat'),
    mCarbs: $('m-carbs'),
    mProteinK: $('m-protein-k'),
    mFatK: $('m-fat-k'),
    mCarbsK: $('m-carbs-k'),
    mTotal: $('m-total'),
    donutCals: $('donut-cals'),
    goalBlock: $('goal-block'),
    goalWeeks: $('goal-weeks'),
    goalDesc: $('goal-desc'),
    recGrid: $('rec-grid'),
    proteinFeedback: $('protein-feedback'),
    calorieFeedback: $('calorie-feedback'),
    goalUnitTag: $('goal-unit-tag'),
    projectionCanvas: $('projectionChart'),
    macroCanvas: $('macroChart'),
    resultsPanel: $('results-panel'),
  };

  const Calc = {
    KG_PER_LB,
    MUSCLE_KCAL_PER_KG: 2500,
    FAT_KCAL_PER_KG: 7700,

    toKg(value) {
      if (!Number.isFinite(value)) return NaN;
      return state.unit === 'lbs' ? value * KG_PER_LB : value;
    },

    fromKg(value) {
      if (!Number.isFinite(value)) return NaN;
      return state.unit === 'lbs' ? value / KG_PER_LB : value;
    },

    round(value, digits = 1) {
      if (!Number.isFinite(value)) return 0;
      const p = 10 ** digits;
      return Math.round(value * p) / p;
    },

    formatNumber(value, digits = 0) {
      if (!Number.isFinite(value)) return '—';
      return value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    },

    formatUnitWeight(kgValue, digits = 1) {
      return `${this.formatNumber(this.fromKg(kgValue), digits)} ${state.unit}`;
    },

    bmr(weightKg, heightCm, age, sex) {
      const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
      return sex === 'female' ? base - 161 : base + 5;
    },

    tdee(bmr, activity) {
      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9,
      };
      return bmr * (multipliers[activity] || 1.55);
    },

    bodyFatPct(weightKg, heightCm, age, sex) {
      if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || !Number.isFinite(age)) return 25;
      const bmi = weightKg / ((heightCm / 100) ** 2);
      let bf = 1.2 * bmi + 0.23 * age - 5.4;
      if (sex === 'male') bf -= 10.8;
      return Math.max(Math.min(bf, 55), sex === 'male' ? 4 : 10);
    },

    proteinStatus(proteinG, weightKg) {
      const ratio = weightKg > 0 ? proteinG / weightKg : 0;

      if (ratio < 1.2) {
        return { ratio, label: 'DANGER - Muscle loss likely.', tone: 'danger', multiplier: 0.35 };
      }
      if (ratio < 1.6) {
        return { ratio, label: 'Suboptimal for growth.', tone: 'warn', multiplier: 0.7 };
      }
      if (ratio <= 2.2) {
        return { ratio, label: 'Optimal for recomposition.', tone: 'gain', multiplier: 1.0 };
      }
      return { ratio, label: 'Saturated range.', tone: 'neutral', multiplier: 0.95 };
    },

    trainingCapMonthlyKg(experience, weightKg) {
      const pct = {
        beginner: 0.015,
        intermediate: 0.0075,
        advanced: 0.0025,
      }[experience] || 0.0075;

      return weightKg * pct;
    },

    adaptiveFatLossKg(deficitKcal) {
      if (deficitKcal <= 0) return 0;
      const first = Math.min(deficitKcal, 1000);
      const rest = Math.max(deficitKcal - 1000, 0);
      return (first / this.FAT_KCAL_PER_KG) + (rest / (this.FAT_KCAL_PER_KG * 1.15));
    },

    phaseBadge(strategy, targetCalories, tdee, proteinInfo) {
      const delta = targetCalories - tdee;
      const absDelta = Math.abs(delta);

      if (strategy === 'cut') {
        if (delta <= -750) return { text: 'Aggressive Mini-Cut', tone: 'loss' };
        if (delta < 0) return { text: 'Precision Cut', tone: 'loss' };
        return { text: 'Cutting Against the Grain', tone: 'warn' };
      }

      if (strategy === 'bulk') {
        if (delta < 300) return { text: 'Lean Bulk', tone: 'gain' };
        return { text: 'Growth Phase', tone: 'gain' };
      }

      if (strategy === 'maintain') {
        if (absDelta <= 100 && proteinInfo.ratio >= 1.6) return { text: 'Optimal Recomp', tone: 'recomp' };
        if (absDelta <= 250) return { text: 'Maintenance Recomp', tone: 'recomp' };
        return { text: 'Drifting Maintenance', tone: 'warn' };
      }

      return { text: 'Custom Phase', tone: 'neutral' };
    },

    verdict({ strategy, proteinInfo, targetCalories, tdee, deficitKcal, surplusKcal }) {
      const absDelta = Math.abs(targetCalories - tdee);

      if (strategy === 'cut') {
        if (deficitKcal > 1000) {
          return {
            title: 'This cut is powerful, but recovery cost is higher.',
            copy: 'Large deficits will drive fat loss, but hunger, training output, and lean-mass retention become more fragile. Keep protein, sleep, and lifting quality tight.',
          };
        }
        if (proteinInfo.ratio >= 1.6) {
          return {
            title: 'This cut is sustainable.',
            copy: 'You are cutting with enough protein to protect lean mass while still making visible progress week to week.',
          };
        }
        return {
          title: 'Fat loss will happen, but muscle protection is weaker.',
          copy: 'The calorie deficit is doing the work, but protein is not yet in the best range for lean-mass retention.',
        };
      }

      if (strategy === 'bulk') {
        if (surplusKcal < 300) {
          return {
            title: 'This is a controlled lean bulk.',
            copy: 'The surplus is small enough to support muscle gain while keeping fat gain more contained.',
          };
        }
        return {
          title: 'Growth is prioritized, with some fat spillover expected.',
          copy: 'The surplus is large enough to push mass gain. Muscle will benefit, but some extra calories will usually land as fat too.',
        };
      }

      if (strategy === 'maintain') {
        if (absDelta <= 100 && proteinInfo.ratio >= 1.6) {
          return {
            title: 'This is the sweet spot for recomposition.',
            copy: 'Scale weight may stay similar, but body composition can change meaningfully. That is the premium outcome here.',
          };
        }
        if (absDelta > 250) {
          return {
            title: 'You are drifting out of maintenance.',
            copy: 'The calorie target is far enough from TDEE that this is no longer a pure recomp setup.',
          };
        }
        return {
          title: 'Recomposition is supported here.',
          copy: 'Calories are close enough to maintenance to allow slow tissue reshaping with progressive training and sufficient protein.',
        };
      }

      return {
        title: 'Your setup is valid, but the signal is mixed.',
        copy: `The current configuration sits ${Math.round(absDelta)} kcal from TDEE.`,
      };
    },

    buildProjectionSeries({ lbmKg, fatMassKg, weeklyMuscleKg, weeklyFatLossKg, weeklyFatGainKg }) {
      const weeks = 12;
      const labels = Array.from({ length: weeks + 1 }, (_, i) => `W${i}`);
      const muscleSeriesKg = [];
      const fatSeriesKg = [];

      for (let i = 0; i <= weeks; i += 1) {
        muscleSeriesKg.push(Math.max(lbmKg + weeklyMuscleKg * i, 0));
        fatSeriesKg.push(Math.max(fatMassKg - weeklyFatLossKg * i + weeklyFatGainKg * i, 0.5));
      }

      return { labels, muscleSeriesKg, fatSeriesKg };
    },

    eta({ currentKg, goalKg, weeklyNetKg, strategy }) {
      const diffKg = goalKg - currentKg;

      if (Math.abs(diffKg) < 0.05) {
        return {
          weeks: 0,
          label: 'Already there',
          copy: 'Your target is basically at the current body weight.',
          unrealistic: false,
        };
      }

      if (strategy === 'maintain' && Math.abs(weeklyNetKg) < 0.0005) {
        return {
          weeks: null,
          label: 'Recomp Mode',
          copy: 'Scale weight stays similar, but body composition can still change.',
          unrealistic: false,
        };
      }

      if ((diffKg > 0 && weeklyNetKg < 0) || (diffKg < 0 && weeklyNetKg > 0)) {
        return {
          weeks: null,
          label: 'Goal/Phase Mismatch',
          copy: 'Your goal direction conflicts with your current phase. Adjust strategy or target weight.',
          unrealistic: true,
          suggestedWeeks: 12,
        };
      }

      if (Math.abs(weeklyNetKg) < 0.0001) {
        return {
          weeks: null,
          label: 'No Net Progress',
          copy: 'Your current setup creates nearly zero weekly weight change.',
          unrealistic: true,
          suggestedWeeks: 12,
        };
      }

      const weeks = Math.ceil(Math.abs(diffKg / weeklyNetKg));

      if (!Number.isFinite(weeks) || weeks > 52) {
        return {
          weeks: null,
          label: 'Very Long Timeline',
          copy: `At the current pace, this target would take too long. A 12–16 week block is more practical.`,
          unrealistic: true,
          suggestedWeeks: 12,
        };
      }

      return {
        weeks,
        label: weeks <= 6 ? 'Fast Track' : weeks <= 16 ? 'Reasonable' : 'Long Game',
        copy: `At ${this.round(Math.abs(weeklyNetKg), 3)} ${state.unit}/week, you could reach the goal in ~${weeks} weeks.`,
        unrealistic: false,
      };
    },

    calculate(input) {
      const {
        sex, strategy, activity, experience,
        age, heightCm, weightKg, protein, calories, goalKg,
      } = input;

      if (![age, heightCm, weightKg, protein].every((v) => Number.isFinite(v) && v > 0)) {
        return { conflict: false, error: 'Missing or invalid required inputs.' };
      }

      const bmr = this.bmr(weightKg, heightCm, age, sex);
      const tdee = this.tdee(bmr, activity);
      const bfPct = this.bodyFatPct(weightKg, heightCm, age, sex);
      const lbmKg = weightKg * (1 - bfPct / 100);
      const fatMassKg = Math.max(weightKg - lbmKg, 0);
      const proteinInfo = this.proteinStatus(protein, weightKg);

      let targetCalories;
      if (Number.isFinite(calories) && calories > 0) {
        targetCalories = calories;
      } else if (strategy === 'cut') {
        targetCalories = tdee - (experience === 'beginner' ? 600 : experience === 'intermediate' ? 500 : 400);
      } else if (strategy === 'bulk') {
        targetCalories = tdee + (experience === 'beginner' ? 350 : 250);
      } else {
        targetCalories = tdee;
      }

      targetCalories = Math.max(targetCalories, 1000);
      const deltaCalories = targetCalories - tdee;
      const surplusKcal = Math.max(deltaCalories, 0);
      const deficitKcal = Math.max(-deltaCalories, 0);

      const monthlyCapKg = this.trainingCapMonthlyKg(experience, weightKg);
      const weeklyCapKg = monthlyCapKg / 4.345;
      const baseMuscleCapacity = weeklyCapKg * proteinInfo.multiplier;

      if (strategy === 'cut' && Number.isFinite(goalKg) && goalKg > weightKg) {
        return {
          conflict: true,
          message: 'You cannot set a higher goal weight while in a fat-loss phase. Switch to Bulk or change the goal.',
        };
      }

      let weeklyMuscleKg = 0;
      let weeklyFatLossKg = 0;
      let weeklyFatGainKg = 0;

      if (strategy === 'bulk') {
        const caloriesForMuscle = Math.min(surplusKcal, baseMuscleCapacity * this.MUSCLE_KCAL_PER_KG);
        weeklyMuscleKg = caloriesForMuscle / this.MUSCLE_KCAL_PER_KG;
        weeklyFatGainKg = Math.max(surplusKcal - caloriesForMuscle, 0) / this.FAT_KCAL_PER_KG;
      } else if (strategy === 'cut') {
        weeklyFatLossKg = this.adaptiveFatLossKg(deficitKcal);
        if (deficitKcal <= 300 && proteinInfo.ratio >= 1.8) {
          weeklyMuscleKg = Math.min(baseMuscleCapacity * 0.15, 0.15);
        }
      } else {
        const recompIntensity = Math.abs(deltaCalories) <= 100 ? 1.0 : Math.max(0.4, 1 - (Math.abs(deltaCalories) / 400));
        weeklyMuscleKg = baseMuscleCapacity * 0.7 * recompIntensity;
        weeklyFatLossKg = baseMuscleCapacity * 0.6 * recompIntensity;

        if (deltaCalories > 100) weeklyMuscleKg *= 1.1;
        if (deltaCalories < -100) weeklyFatLossKg *= 1.1;
      }

      const weeklyNetKg = weeklyMuscleKg + weeklyFatGainKg - weeklyFatLossKg;

      const proteinKcal = Math.min(protein * 4, targetCalories * 0.6);
      let fatKcal = Math.max(targetCalories * 0.25, weightKg * 0.6 * 9);
      fatKcal = Math.min(fatKcal, Math.max(targetCalories - proteinKcal, 0));
      let carbsKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);

      if (proteinKcal + fatKcal > targetCalories) {
        fatKcal = Math.max(targetCalories - proteinKcal, 0);
        carbsKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
      }

      const macros = {
        protein: Math.max(Math.round(protein), 0),
        fat: Math.max(Math.round(fatKcal / 9), 0),
        carbs: Math.max(Math.round(carbsKcal / 4), 0),
      };
      macros.total = (macros.protein * 4) + (macros.fat * 9) + (macros.carbs * 4);

      const phaseBadge = this.phaseBadge(strategy, targetCalories, tdee, proteinInfo);
      const verdict = this.verdict({
        strategy,
        proteinInfo,
        targetCalories,
        tdee,
        deficitKcal,
        surplusKcal,
      });

      const eta = Number.isFinite(goalKg)
        ? this.eta({ currentKg: weightKg, goalKg, weeklyNetKg, strategy })
        : null;

      return {
        conflict: false,
        sex,
        strategy,
        activity,
        experience,
        age,
        heightCm,
        weightKg,
        goalKg,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        deltaCalories: Math.round(deltaCalories),
        surplusKcal: Math.round(surplusKcal),
        deficitKcal: Math.round(deficitKcal),
        bfPct: this.round(bfPct, 1),
        lbmKg,
        fatMassKg,
        proteinInfo,
        weeklyMuscleKg,
        weeklyFatLossKg,
        weeklyFatGainKg,
        weeklyNetKg,
        macros,
        phaseBadge,
        verdict,
        eta,
        projection: this.buildProjectionSeries({
          lbmKg,
          fatMassKg,
          weeklyMuscleKg,
          weeklyFatLossKg,
          weeklyFatGainKg,
        }),
      };
    },
  };

  const View = {
    clearCharts() {
      if (state.macroChart) {
        state.macroChart.destroy();
        state.macroChart = null;
      }
      if (state.projectionChart) {
        state.projectionChart.destroy();
        state.projectionChart = null;
      }
    },

    setIdle() {
      DOM.idleScreen.style.display = 'flex';
      DOM.warningBanner.hidden = true;
      DOM.resultsBody.style.display = 'none';
      this.clearCharts();
    },

    showWarning(message) {
      DOM.idleScreen.style.display = 'none';
      DOM.warningBanner.hidden = false;
      DOM.warningBanner.textContent = message;
      DOM.resultsBody.style.display = 'none';
      this.clearCharts();
    },

    showResults() {
      DOM.idleScreen.style.display = 'none';
      DOM.warningBanner.hidden = true;
      DOM.resultsBody.style.display = 'block';
      DOM.resultsBody.classList.remove('is-visible');
      void DOM.resultsBody.offsetHeight;
      DOM.resultsBody.classList.add('is-visible');
    },

    setUnit(unit) {
      state.unit = unit;
      if (DOM.goalUnitTag) DOM.goalUnitTag.textContent = unit;
      document.querySelectorAll('.utbtn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.unit === unit);
      });
    },

    convertWeightFields(newUnit) {
      const convert = (input) => {
        if (!input) return;
        const raw = parseFloat(input.value);
        if (!Number.isFinite(raw) || raw <= 0) return;

        const converted = newUnit === 'kg'
          ? raw * KG_PER_LB
          : raw / KG_PER_LB;

        if (Number.isFinite(converted)) input.value = converted.toFixed(1);
      };

      convert($('weight'));
      convert($('goal-weight'));
    },

    getInputs() {
      const sex = document.querySelector('input[name="sex"]:checked')?.value || 'male';
      const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'maintain';

      const age = parseFloat($('age').value);
      const heightCm = parseFloat($('height').value);
      const weightRaw = parseFloat($('weight').value);
      const protein = parseFloat($('protein').value);
      const caloriesRaw = parseFloat($('calories').value);
      const goalRaw = parseFloat($('goal-weight').value);

      return {
        sex,
        strategy,
        age,
        heightCm,
        weightKg: Calc.toKg(weightRaw),
        protein,
        calories: Number.isFinite(caloriesRaw) ? caloriesRaw : null,
        goalKg: Number.isFinite(goalRaw) ? Calc.toKg(goalRaw) : null,
        activity: $('activity').value,
        experience: $('experience').value,
      };
    },

    validateInputs(input) {
      const checks = [
        { id: 'age', value: input.age, min: 13, max: 100 },
        { id: 'height', value: input.heightCm, min: 100, max: 250 },
        { id: 'weight', value: input.weightKg, min: 30, max: 400 },
        { id: 'protein', value: input.protein, min: 0, max: 600 },
      ];

      const invalidIds = [];

      checks.forEach((field) => {
        const el = $(field.id);
        const valid = Number.isFinite(field.value) && field.value >= field.min && field.value <= field.max;
        if (!valid && el) {
          el.classList.add('error');
          invalidIds.push(field.id);
          el.addEventListener('input', () => el.classList.remove('error'), { once: true });
        }
      });

      const hasStrategy = Boolean(document.querySelector('input[name="strategy"]:checked'));
      if (!hasStrategy) invalidIds.push('strategy');

      return {
        valid: invalidIds.length === 0,
        invalidIds,
      };
    },

    updateProteinFeedback() {
      const weight = parseFloat($('weight').value);
      const protein = parseFloat($('protein').value);

      if (!Number.isFinite(weight) || !Number.isFinite(protein) || weight <= 0 || protein < 0) {
        if (DOM.proteinFeedback) DOM.proteinFeedback.textContent = '';
        if (DOM.calorieFeedback) DOM.calorieFeedback.textContent = '';
        return;
      }

      const weightKg = Calc.toKg(weight);
      const info = Calc.proteinStatus(protein, weightKg);
      const ratio = info.ratio.toFixed(1);

      const colorMap = {
        danger: 'var(--loss)',
        warn: 'var(--warn)',
        gain: 'var(--gain)',
        neutral: 'var(--text-muted)',
      };

      if (DOM.proteinFeedback) {
        DOM.proteinFeedback.textContent = `${ratio} g/kg — ${info.label}`;
        DOM.proteinFeedback.style.color = colorMap[info.tone] || 'var(--text-muted)';
      }

      const calories = parseFloat($('calories').value);
      const strategy = document.querySelector('input[name="strategy"]:checked')?.value || 'maintain';

      if (DOM.calorieFeedback) {
        if (Number.isFinite(calories)) {
          DOM.calorieFeedback.textContent = `Custom: ${calories} kcal/day`;
        } else if (strategy === 'cut') {
          DOM.calorieFeedback.textContent = 'Auto: TDEE - 400~600 kcal (smart deficit)';
        } else if (strategy === 'bulk') {
          DOM.calorieFeedback.textContent = 'Auto: TDEE + 250~350 kcal (lean bulk)';
        } else {
          DOM.calorieFeedback.textContent = 'Auto: TDEE (maintenance)';
        }
      }
    },

    setPhaseBadge(result) {
      DOM.statusBadge.className = `status-badge badge-${result.phaseBadge.tone}`;
      DOM.statusBadge.textContent = result.phaseBadge.text;
    },

    setVerdict(result) {
      DOM.verdictTitle.textContent = result.verdict.title;
      DOM.verdictCopy.textContent = result.verdict.copy;
    },

    setMeta(result) {
      const caloriesLabel = result.deltaCalories > 0
        ? `${result.deltaCalories} kcal surplus`
        : result.deltaCalories < 0
          ? `${Math.abs(result.deltaCalories)} kcal deficit`
          : 'at maintenance';

      DOM.rMeta.textContent = `${result.targetCalories.toLocaleString()} kcal/day · ${caloriesLabel} · ${result.bfPct.toFixed(1)}% estimated body fat`;
    },

    setKeyMetrics(result) {
      DOM.rBMR.textContent = result.bmr.toLocaleString();
      DOM.rTDEE.textContent = result.tdee.toLocaleString();
      DOM.rBF.textContent = `${result.bfPct.toFixed(1)}%`;
      DOM.rLBM.textContent = Calc.formatUnitWeight(result.lbmKg, 1);
    },

    setWeeklyProjections(result) {
      const musclePerWeek = Calc.round(result.weeklyMuscleKg, 3);
      const fatLossPerWeek = Calc.round(result.weeklyFatLossKg, 3);
      const fatGainPerWeek = Calc.round(result.weeklyFatGainKg, 3);
      const netPerWeek = Calc.round(result.weeklyNetKg, 3);

      DOM.rMuscle.textContent = `+${Calc.formatUnitWeight(musclePerWeek, 3)}`;
      DOM.rFat.textContent = fatGainPerWeek > 0
        ? `+${Calc.formatUnitWeight(fatGainPerWeek, 3)}`
        : `-${Calc.formatUnitWeight(Math.abs(fatLossPerWeek), 3)}`;
      DOM.rNet.textContent = `${netPerWeek >= 0 ? '+' : ''}${Calc.formatUnitWeight(netPerWeek, 3)}`;

      const maxValue = Math.max(musclePerWeek, fatLossPerWeek, Math.abs(netPerWeek), 0.001);

      requestAnimationFrame(() => {
        DOM.barMuscle.style.width = `${((musclePerWeek / maxValue) * 100).toFixed(1)}%`;
        DOM.barFat.style.width = `${((fatLossPerWeek / maxValue) * 100).toFixed(1)}%`;
        DOM.barNet.style.width = `${((Math.abs(netPerWeek) / maxValue) * 100).toFixed(1)}%`;
      });
    },

    setMacros(result) {
      const m = result.macros;
      DOM.mProtein.textContent = `${m.protein}g`;
      DOM.mFat.textContent = `${m.fat}g`;
      DOM.mCarbs.textContent = `${m.carbs}g`;
      DOM.mProteinK.textContent = `${(m.protein * 4).toLocaleString()} kcal`;
      DOM.mFatK.textContent = `${(m.fat * 9).toLocaleString()} kcal`;
      DOM.mCarbsK.textContent = `${(m.carbs * 4).toLocaleString()} kcal`;
      DOM.mTotal.textContent = `${m.total.toLocaleString()} kcal`;
      DOM.donutCals.textContent = m.total.toLocaleString();
    },

    renderMacroChart(result) {
      if (!DOM.macroCanvas || typeof Chart === 'undefined') return;

      if (state.macroChart) state.macroChart.destroy();

      const ctx = DOM.macroCanvas.getContext('2d');
      state.macroChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Protein', 'Fat', 'Carbs'],
          datasets: [{
            data: [result.macros.protein * 4, result.macros.fat * 9, result.macros.carbs * 4],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#0D1420' },
          },
        },
      });
    },

    renderProjectionChart(result) {
      if (!DOM.projectionCanvas || typeof Chart === 'undefined') return;

      if (state.projectionChart) state.projectionChart.destroy();

      const { labels, muscleSeriesKg, fatSeriesKg } = result.projection;
      const unit = state.unit;

      const ctx = DOM.projectionCanvas.getContext('2d');
      state.projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Muscle Mass',
              data: muscleSeriesKg.map((v) => Calc.fromKg(v)),
              borderWidth: 2.6,
              tension: 0.36,
              pointRadius: 0,
            },
            {
              label: 'Fat Mass',
              data: fatSeriesKg.map((v) => Calc.fromKg(v)),
              borderWidth: 2.6,
              tension: 0.36,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} ${unit}`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#7A8FA3' },
            },
            y: {
              ticks: {
                color: '#7A8FA3',
                callback: (value) => `${value} ${unit}`,
              },
            },
          },
        },
      });
    },

    renderETA(result) {
      if (!result.eta) {
        DOM.goalBlock.style.display = 'none';
        return;
      }

      DOM.goalBlock.style.display = 'flex';
      DOM.goalWeeks.textContent = result.eta.unrealistic
        ? 'UNREALISTIC TIMELINE'
        : result.eta.weeks === 0
          ? 'ON TARGET'
          : `${result.eta.weeks} WEEKS`;

      DOM.goalDesc.textContent = result.eta.unrealistic && result.eta.suggestedWeeks
        ? `${result.eta.copy} Suggested path: ${result.eta.suggestedWeeks}-week block, then reassess.`
        : result.eta.copy;
    },

    renderRecommendations(result) {
      const cards = [];

      const ratio = result.proteinInfo.ratio;
      const strategy = result.strategy;
      const delta = result.deltaCalories;

      if (ratio < 1.2) {
        cards.push({
          icon: '⚠',
          tone: 'warn',
          title: 'Protein is too low',
          text: `You are at ${ratio.toFixed(1)} g/kg. That is below the muscle-protection floor.`,
        });
      } else if (ratio < 1.6) {
        cards.push({
          icon: '↑',
          tone: 'warn',
          title: 'Protein is underpowered',
          text: `You are at ${ratio.toFixed(1)} g/kg. Workable, but not ideal for growth.`,
        });
      } else {
        cards.push({
          icon: '✓',
          tone: 'gain',
          title: 'Protein status is excellent',
          text: `You are at ${ratio.toFixed(1)} g/kg, a strong zone for growth and retention.`,
        });
      }

      if (strategy === 'cut') {
        cards.push(result.deficitKcal > 1000
          ? {
              icon: '🔥',
              tone: 'warn',
              title: 'Cut is aggressive',
              text: `Deficit is ${result.deficitKcal} kcal/day. Fat loss will happen, but recovery cost is higher.`,
            }
          : {
              icon: '↓',
              tone: 'loss',
              title: 'Cut is well structured',
              text: 'The phase is centered on fat loss. With enough protein and training, muscle retention should hold up.',
            });
      } else if (strategy === 'bulk') {
        cards.push(result.surplusKcal < 300
          ? {
              icon: '↗',
              tone: 'gain',
              title: 'Lean bulk detected',
              text: `Surplus is ${result.surplusKcal} kcal/day — ideal for controlled mass gain.`,
            }
          : {
              icon: '⬆',
              tone: 'gain',
              title: 'Growth is prioritized',
              text: `Surplus is ${result.surplusKcal} kcal/day. Muscle gain comes first, but expect some fat spillover.`,
            });
      } else {
        cards.push({
          icon: '◌',
          tone: 'recomp',
          title: 'Recomp setup is on point',
          text: 'Calories are close to maintenance — the sweet spot for slow recomposition.',
        });
      }

      if (delta > 750) {
        cards.push({
          icon: '⚠',
          tone: 'warn',
          title: 'Excessive surplus',
          text: `You are ${delta} kcal above TDEE. Not all of that will become muscle.`,
        });
      } else if (delta < -1000) {
        cards.push({
          icon: '⚠',
          tone: 'warn',
          title: 'Deficit is very large',
          text: `You are ${Math.abs(delta)} kcal below TDEE. Adaptation may slow fat loss.`,
        });
      } else if (strategy === 'maintain') {
        cards.push({
          icon: '✓',
          tone: 'recomp',
          title: 'Maintenance window is tight',
          text: 'Close enough to TDEE to support visible recomposition.',
        });
      } else {
        cards.push({
          icon: '●',
          tone: 'neutral',
          title: 'Calories are behaving',
          text: `Current target sits ${Math.abs(delta)} kcal ${delta >= 0 ? 'above' : 'below'} TDEE.`,
        });
      }

      if (!result.goalKg) {
        cards.push({
          icon: '◆',
          tone: 'neutral',
          title: 'No target weight entered',
          text: 'Add a target weight to unlock the ETA block.',
        });
      } else if (result.eta && result.eta.unrealistic) {
        cards.push({
          icon: '⌛',
          tone: 'warn',
          title: 'Timeline is unrealistic',
          text: result.eta.copy,
        });
      } else if (strategy === 'maintain') {
        cards.push({
          icon: '◈',
          tone: 'recomp',
          title: 'Mirror progress matters more',
          text: 'For recomp, track waist, gym performance, and photos alongside weight.',
        });
      } else {
        cards.push({
          icon: '✔',
          tone: 'gain',
          title: 'Goal rate is plausible',
          text: result.eta ? result.eta.copy : 'The target is moving in a plausible direction.',
        });
      }

      DOM.recGrid.innerHTML = '';

      cards.forEach((card) => {
        const cardEl = document.createElement('div');
        cardEl.className = `rec-card rec-${card.tone}`;

        const iconEl = document.createElement('span');
        iconEl.className = 'rec-icon';
        iconEl.textContent = card.icon;

        const titleEl = document.createElement('div');
        titleEl.className = 'rec-title';
        titleEl.textContent = card.title;

        const textEl = document.createElement('div');
        textEl.className = 'rec-text';
        textEl.textContent = card.text;

        cardEl.appendChild(iconEl);
        cardEl.appendChild(titleEl);
        cardEl.appendChild(textEl);
        DOM.recGrid.appendChild(cardEl);
      });
    },

    render(result) {
      state.lastResult = result;
      this.showResults();
      this.setPhaseBadge(result);
      this.setMeta(result);
      this.setVerdict(result);
      this.setKeyMetrics(result);
      this.setWeeklyProjections(result);
      this.setMacros(result);
      this.renderMacroChart(result);
      this.renderProjectionChart(result);
      this.renderETA(result);
      this.renderRecommendations(result);
    },

    persist() {
      const payload = {
        unit: state.unit,
        sex: document.querySelector('input[name="sex"]:checked')?.value || 'male',
        strategy: document.querySelector('input[name="strategy"]:checked')?.value || 'maintain',
        age: $('age')?.value ?? '',
        height: $('height')?.value ?? '',
        weight: $('weight')?.value ?? '',
        activity: $('activity')?.value ?? 'moderate',
        experience: $('experience')?.value ?? 'intermediate',
        protein: $('protein')?.value ?? '',
        calories: $('calories')?.value ?? '',
        goalWeight: $('goal-weight')?.value ?? '',
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (_) {}
    },

    loadPersistedState() {
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      } catch (_) {
        saved = null;
      }

      if (!saved) return false;

      if (saved.sex) {
        const radio = document.querySelector(`input[name="sex"][value="${saved.sex}"]`);
        if (radio) radio.checked = true;
      }

      if (saved.strategy) {
        const radio = document.querySelector(`input[name="strategy"][value="${saved.strategy}"]`);
        if (radio) radio.checked = true;
      }

      if (saved.age !== undefined) $('age').value = saved.age;
      if (saved.height !== undefined) $('height').value = saved.height;
      if (saved.weight !== undefined) $('weight').value = saved.weight;
      if (saved.activity !== undefined) $('activity').value = saved.activity;
      if (saved.experience !== undefined) $('experience').value = saved.experience;
      if (saved.protein !== undefined) $('protein').value = saved.protein;
      if (saved.calories !== undefined) $('calories').value = saved.calories;
      if (saved.goalWeight !== undefined) $('goal-weight').value = saved.goalWeight;

      if (saved.unit === 'kg' || saved.unit === 'lbs') {
        this.setUnit(saved.unit);
      }

      this.updateProteinFeedback();
      return true;
    },
  };

  function runAnalysis() {
    const input = View.getInputs();
    const validation = View.validateInputs(input);

    if (!validation.valid) {
      View.setIdle();
      return;
    }

    const result = Calc.calculate(input);

    if (result.error) {
      View.showWarning(result.error);
      View.persist();
      return;
    }

    if (result.conflict) {
      View.showWarning(result.message);
      View.persist();
      return;
    }

    View.persist();
    View.render(result);

    if (window.innerWidth < 860 && DOM.resultsPanel) {
      DOM.resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function applyUnitSwitch(newUnit) {
    if (newUnit === state.unit) return;

    View.convertWeightFields(newUnit);
    View.setUnit(newUnit);
    View.persist();
    View.updateProteinFeedback();

    if (state.lastResult) {
      runAnalysis();
    }
  }

  document.querySelectorAll('.utbtn').forEach((btn) => {
    btn.addEventListener('click', () => applyUnitSwitch(btn.dataset.unit));
  });

  document.querySelectorAll('input, select').forEach((field) => {
    field.addEventListener('input', () => {
      View.persist();
      View.updateProteinFeedback();
    });

    field.addEventListener('change', () => {
      View.persist();
      View.updateProteinFeedback();
    });
  });

  document.querySelectorAll('input[name="strategy"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      View.updateProteinFeedback();
      View.persist();
    });
  });

  DOM.form?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (DOM.btnCalc) {
      DOM.btnCalc.disabled = true;
      const label = DOM.btnCalc.querySelector('span');
      if (label) label.textContent = 'Processing…';
    }

    window.setTimeout(() => {
      try {
        runAnalysis();
      } catch (error) {
        console.error(error);
        View.showWarning('An error occurred. Please check your inputs.');
      } finally {
        if (DOM.btnCalc) {
          DOM.btnCalc.disabled = false;
          const label = DOM.btnCalc.querySelector('span');
          if (label) label.textContent = 'Run Analysis';
        }
      }
    }, 220);
  });

  DOM.btnReset?.addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    window.location.reload();
  });

  const hasState = View.loadPersistedState();
  View.updateProteinFeedback();

  if (hasState) {
    const input = View.getInputs();
    const validation = View.validateInputs(input);
    if (validation.valid) {
      runAnalysis();
    } else {
      View.setIdle();
    }
  } else {
    View.setIdle();
  }
});