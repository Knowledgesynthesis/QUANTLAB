/**
 * Bibliography. Every DOI is checked against doi.org by `npm run verify:refs`.
 * `topic` groups entries on the References page.
 */
export interface Reference {
  id: string;
  authors: string;
  year: number;
  title: string;
  source: string;
  doi?: string;
  url?: string;
  topic: 'Data management' | 'Cleaning & modelling choices' | 'Missing data' | 'Regression diagnostics' | 'Collinearity' | 'Prediction & validation' | 'Resampling & inference' | 'Reproducibility & reporting';
  note?: string;
}

export const references: Reference[] = [
  // Data management
  { id: 'wickham2014', authors: 'Wickham H', year: 2014, title: 'Tidy data', source: 'J Stat Softw 59(10)', doi: '10.18637/jss.v059.i10', topic: 'Data management' },
  { id: 'broman2018', authors: 'Broman KW, Woo KH', year: 2018, title: 'Data organization in spreadsheets', source: 'Am Stat 72(1):2–10', doi: '10.1080/00031305.2017.1375989', topic: 'Data management' },
  { id: 'vandenbroeck2005', authors: 'Van den Broeck J, Cunningham SA, Eeckels R, Herbst K', year: 2005, title: 'Data cleaning: detecting, diagnosing, and editing data abnormalities', source: 'PLoS Med 2(10):e267', doi: '10.1371/journal.pmed.0020267', topic: 'Data management' },
  { id: 'wilkinson2016', authors: 'Wilkinson MD, Dumontier M, Aalbersberg IJ, et al.', year: 2016, title: 'The FAIR Guiding Principles for scientific data management and stewardship', source: 'Sci Data 3:160018', doi: '10.1038/sdata.2016.18', topic: 'Data management' },
  { id: 'inker2021', authors: 'Inker LA, Eneanya ND, Coresh J, et al.', year: 2021, title: 'New creatinine- and cystatin C–based equations to estimate GFR without race', source: 'N Engl J Med 385:1737–1749', doi: '10.1056/NEJMoa2102953', topic: 'Data management', note: 'CKD-EPI 2021 equation used to compute eGFR in the synthetic cohort.' },

  // Cleaning & modelling choices
  { id: 'altman2006', authors: 'Altman DG, Royston P', year: 2006, title: 'The cost of dichotomising continuous variables', source: 'BMJ 332:1080', doi: '10.1136/bmj.332.7549.1080', topic: 'Cleaning & modelling choices' },
  { id: 'royston2006', authors: 'Royston P, Altman DG, Sauerbrei W', year: 2006, title: 'Dichotomizing continuous predictors in multiple regression: a bad idea', source: 'Stat Med 25(1):127–141', doi: '10.1002/sim.2331', topic: 'Cleaning & modelling choices' },
  { id: 'altman1994', authors: 'Altman DG, Lausen B, Sauerbrei W, Schumacher M', year: 1994, title: 'Dangers of using "optimal" cutpoints in the evaluation of prognostic factors', source: 'J Natl Cancer Inst 86(11):829–835', doi: '10.1093/jnci/86.11.829', topic: 'Cleaning & modelling choices' },
  { id: 'leys2013', authors: 'Leys C, Ley C, Klein O, Bernard P, Licata L', year: 2013, title: 'Detecting outliers: do not use standard deviation around the mean, use absolute deviation around the median', source: 'J Exp Soc Psychol 49(4):764–766', doi: '10.1016/j.jesp.2013.03.013', topic: 'Cleaning & modelling choices' },
  { id: 'iglewicz1993', authors: 'Iglewicz B, Hoaglin DC', year: 1993, title: 'How to Detect and Handle Outliers', source: 'ASQC Quality Press (ASQC Basic References in Quality Control, vol. 16)', topic: 'Cleaning & modelling choices' },
  { id: 'harrell2015', authors: 'Harrell FE Jr', year: 2015, title: 'Regression Modeling Strategies, 2nd ed.', source: 'Springer', doi: '10.1007/978-3-319-19425-7', topic: 'Cleaning & modelling choices' },
  { id: 'gelman2020', authors: 'Gelman A, Hill J, Vehtari A', year: 2020, title: 'Regression and Other Stories', source: 'Cambridge University Press', doi: '10.1017/9781139161879', topic: 'Cleaning & modelling choices' },
  { id: 'duan1983', authors: 'Duan N', year: 1983, title: 'Smearing estimate: a nonparametric retransformation method', source: 'J Am Stat Assoc 78(383):605–610', doi: '10.1080/01621459.1983.10478017', topic: 'Cleaning & modelling choices' },
  { id: 'heinze2018', authors: 'Heinze G, Wallisch C, Dunkler D', year: 2018, title: 'Variable selection – a review and recommendations for the practicing statistician', source: 'Biom J 60(3):431–449', doi: '10.1002/bimj.201700067', topic: 'Cleaning & modelling choices' },

  // Missing data
  { id: 'rubin1976', authors: 'Rubin DB', year: 1976, title: 'Inference and missing data', source: 'Biometrika 63(3):581–592', doi: '10.1093/biomet/63.3.581', topic: 'Missing data' },
  { id: 'sterne2009', authors: 'Sterne JAC, White IR, Carlin JB, et al.', year: 2009, title: 'Multiple imputation for missing data in epidemiological and clinical research: potential and pitfalls', source: 'BMJ 338:b2393', doi: '10.1136/bmj.b2393', topic: 'Missing data' },
  { id: 'white2011', authors: 'White IR, Royston P, Wood AM', year: 2011, title: 'Multiple imputation using chained equations: issues and guidance for practice', source: 'Stat Med 30(4):377–399', doi: '10.1002/sim.4067', topic: 'Missing data' },
  { id: 'vanbuuren2018', authors: 'van Buuren S', year: 2018, title: 'Flexible Imputation of Missing Data, 2nd ed.', source: 'Chapman & Hall/CRC (free online edition)', doi: '10.1201/9780429492259', url: 'https://stefvanbuuren.name/fimd/', topic: 'Missing data' },
  { id: 'moons2006', authors: 'Moons KGM, Donders RART, Stijnen T, Harrell FE Jr', year: 2006, title: 'Using the outcome for imputation of missing predictor values was preferred', source: 'J Clin Epidemiol 59(10):1092–1101', doi: '10.1016/j.jclinepi.2006.01.009', topic: 'Missing data' },
  { id: 'hughes2019', authors: 'Hughes RA, Heron J, Sterne JAC, Tilling K', year: 2019, title: 'Accounting for missing data in statistical analyses: multiple imputation is not always the answer', source: 'Int J Epidemiol 48(4):1294–1304', doi: '10.1093/ije/dyz032', topic: 'Missing data' },
  { id: 'madleydowd2019', authors: 'Madley-Dowd P, Hughes R, Tilling K, Heron J', year: 2019, title: 'The proportion of missing data should not be used to guide decisions on multiple imputation', source: 'J Clin Epidemiol 110:63–73', doi: '10.1016/j.jclinepi.2019.02.016', topic: 'Missing data' },
  { id: 'lee2021', authors: 'Lee KJ, Tilling KM, Cornish RP, et al.', year: 2021, title: 'Framework for the treatment and reporting of missing data in observational studies: the TARMOS framework', source: 'J Clin Epidemiol 134:79–88', doi: '10.1016/j.jclinepi.2021.01.008', topic: 'Missing data' },
  { id: 'vonhippel2020', authors: 'von Hippel PT', year: 2020, title: 'How many imputations do you need? A two-stage calculation using a quadratic rule', source: 'Sociol Methods Res 49(3):699–718', doi: '10.1177/0049124117747303', topic: 'Missing data' },
  { id: 'little1988', authors: 'Little RJA', year: 1988, title: 'A test of missing completely at random for multivariate data with missing values', source: 'J Am Stat Assoc 83(404):1198–1202', doi: '10.1080/01621459.1988.10478722', topic: 'Missing data' },
  { id: 'groenwold2012', authors: 'Groenwold RHH, White IR, Donders ART, et al.', year: 2012, title: 'Missing covariate data in clinical research: when and when not to use the missing-indicator method for analysis', source: 'CMAJ 184(11):1265–1269', doi: '10.1503/cmaj.110977', topic: 'Missing data' },
  { id: 'cro2020', authors: 'Cro S, Morris TP, Kenward MG, Carpenter JR', year: 2020, title: 'Sensitivity analysis for clinical trials with missing continuous outcome data using controlled multiple imputation: a practical guide', source: 'Stat Med 39(21):2815–2842', doi: '10.1002/sim.8569', topic: 'Missing data' },
  { id: 'carpenter2013', authors: 'Carpenter JR, Kenward MG', year: 2013, title: 'Multiple Imputation and its Application', source: 'Wiley', doi: '10.1002/9781119942283', topic: 'Missing data' },
  { id: 'barnard1999', authors: 'Barnard J, Rubin DB', year: 1999, title: 'Small-sample degrees of freedom with multiple imputation', source: 'Biometrika 86(4):948–955', doi: '10.1093/biomet/86.4.948', topic: 'Missing data' },
  { id: 'rubin1987', authors: 'Rubin DB', year: 1987, title: 'Multiple Imputation for Nonresponse in Surveys', source: 'Wiley', doi: '10.1002/9780470316696', topic: 'Missing data' },
  { id: 'wahl2016', authors: 'Wahl S, Boulesteix AL, Zierer A, Thorand B, van de Wiel MA', year: 2016, title: 'Assessment of predictive performance in incomplete data by combining internal validation and multiple imputation', source: 'BMC Med Res Methodol 16:144', doi: '10.1186/s12874-016-0239-7', topic: 'Missing data' },

  // Regression diagnostics
  { id: 'cook1977', authors: 'Cook RD', year: 1977, title: 'Detection of influential observation in linear regression', source: 'Technometrics 19(1):15–18', doi: '10.1080/00401706.1977.10489493', topic: 'Regression diagnostics' },
  { id: 'belsley1980', authors: 'Belsley DA, Kuh E, Welsch RE', year: 1980, title: 'Regression Diagnostics: Identifying Influential Data and Sources of Collinearity', source: 'Wiley', doi: '10.1002/0471725153', topic: 'Regression diagnostics' },
  { id: 'white1980', authors: 'White H', year: 1980, title: 'A heteroskedasticity-consistent covariance matrix estimator and a direct test for heteroskedasticity', source: 'Econometrica 48(4):817–838', doi: '10.2307/1912934', topic: 'Regression diagnostics' },
  { id: 'longervin2000', authors: 'Long JS, Ervin LH', year: 2000, title: 'Using heteroscedasticity consistent standard errors in the linear regression model', source: 'Am Stat 54(3):217–224', doi: '10.1080/00031305.2000.10474549', topic: 'Regression diagnostics' },
  { id: 'breusch1979', authors: 'Breusch TS, Pagan AR', year: 1979, title: 'A simple test for heteroscedasticity and random coefficient variation', source: 'Econometrica 47(5):1287–1294', doi: '10.2307/1911963', topic: 'Regression diagnostics' },
  { id: 'lumley2002', authors: 'Lumley T, Diehr P, Emerson S, Chen L', year: 2002, title: 'The importance of the normality assumption in large public health data sets', source: 'Annu Rev Public Health 23:151–169', doi: '10.1146/annurev.publhealth.23.100901.140546', topic: 'Regression diagnostics' },
  { id: 'cleveland1979', authors: 'Cleveland WS', year: 1979, title: 'Robust locally weighted regression and smoothing scatterplots', source: 'J Am Stat Assoc 74(368):829–836', doi: '10.1080/01621459.1979.10481038', topic: 'Regression diagnostics' },
  { id: 'firth1993', authors: 'Firth D', year: 1993, title: 'Bias reduction of maximum likelihood estimates', source: 'Biometrika 80(1):27–38', doi: '10.1093/biomet/80.1.27', topic: 'Regression diagnostics' },
  { id: 'huber1964', authors: 'Huber PJ', year: 1964, title: 'Robust estimation of a location parameter', source: 'Ann Math Stat 35(1):73–101', doi: '10.1214/aoms/1177703732', topic: 'Regression diagnostics' },

  // Collinearity
  { id: 'fox1992', authors: 'Fox J, Monette G', year: 1992, title: 'Generalized collinearity diagnostics', source: 'J Am Stat Assoc 87(417):178–183', doi: '10.1080/01621459.1992.10475190', topic: 'Collinearity' },
  { id: 'obrien2007', authors: "O'Brien RM", year: 2007, title: 'A caution regarding rules of thumb for variance inflation factors', source: 'Qual Quant 41:673–690', doi: '10.1007/s11135-006-9018-6', topic: 'Collinearity' },
  { id: 'echambadi2007', authors: 'Echambadi R, Hess JD', year: 2007, title: 'Mean-centering does not alleviate collinearity problems in moderated multiple regression models', source: 'Marketing Sci 26(3):438–445', doi: '10.1287/mksc.1060.0263', topic: 'Collinearity' },
  { id: 'zou2005', authors: 'Zou H, Hastie T', year: 2005, title: 'Regularization and variable selection via the elastic net', source: 'J R Stat Soc B 67(2):301–320', doi: '10.1111/j.1467-9868.2005.00503.x', topic: 'Collinearity' },
  { id: 'hernan2016', authors: 'Hernán MA, Robins JM', year: 2016, title: 'Using big data to emulate a target trial when a randomized trial is not available', source: 'Am J Epidemiol 183(8):758–764', doi: '10.1093/aje/kwv254', topic: 'Collinearity', note: 'Causal questions need a causal design; collinearity statistics cannot choose confounders.' },

  // Prediction & validation
  { id: 'steyerberg2019', authors: 'Steyerberg EW', year: 2019, title: 'Clinical Prediction Models, 2nd ed.', source: 'Springer', doi: '10.1007/978-3-030-16399-0', topic: 'Prediction & validation' },
  { id: 'steyerberg2001', authors: 'Steyerberg EW, Harrell FE Jr, Borsboom GJ, et al.', year: 2001, title: 'Internal validation of predictive models: efficiency of some procedures for logistic regression analysis', source: 'J Clin Epidemiol 54(8):774–781', doi: '10.1016/S0895-4356(01)00341-9', topic: 'Prediction & validation' },
  { id: 'steyerberg2016', authors: 'Steyerberg EW, Harrell FE Jr', year: 2016, title: 'Prediction models need appropriate internal, internal–external, and external validation', source: 'J Clin Epidemiol 69:245–247', doi: '10.1016/j.jclinepi.2015.04.005', topic: 'Prediction & validation' },
  { id: 'vancalster2019', authors: 'Van Calster B, McLernon DJ, van Smeden M, et al.', year: 2019, title: 'Calibration: the Achilles heel of predictive analytics', source: 'BMC Med 17:230', doi: '10.1186/s12916-019-1466-7', topic: 'Prediction & validation' },
  { id: 'riley2020', authors: 'Riley RD, Ensor J, Snell KIE, et al.', year: 2020, title: 'Calculating the sample size required for developing a clinical prediction model', source: 'BMJ 368:m441', doi: '10.1136/bmj.m441', topic: 'Prediction & validation' },
  { id: 'riley2024', authors: 'Riley RD, Archer L, Snell KIE, et al.', year: 2024, title: 'Evaluation of clinical prediction models (part 2): how to undertake an external validation study', source: 'BMJ 384:e074820', doi: '10.1136/bmj-2023-074820', topic: 'Prediction & validation' },
  { id: 'vansmeden2016', authors: 'van Smeden M, de Groot JAH, Moons KGM, et al.', year: 2016, title: 'No rationale for 1 variable per 10 events criterion for binary logistic regression analysis', source: 'BMC Med Res Methodol 16:163', doi: '10.1186/s12874-016-0267-3', topic: 'Prediction & validation' },
  { id: 'vickers2006', authors: 'Vickers AJ, Elkin EB', year: 2006, title: 'Decision curve analysis: a novel method for evaluating prediction models', source: 'Med Decis Making 26(6):565–574', doi: '10.1177/0272989X06295361', topic: 'Prediction & validation' },
  { id: 'vancalster2018', authors: 'Van Calster B, Wynants L, Verbeek JFM, et al.', year: 2018, title: 'Reporting and interpreting decision curve analysis: a guide for investigators', source: 'Eur Urol 74(6):796–804', doi: '10.1016/j.eururo.2018.08.038', topic: 'Prediction & validation' },
  { id: 'hanley1982', authors: 'Hanley JA, McNeil BJ', year: 1982, title: 'The meaning and use of the area under a receiver operating characteristic (ROC) curve', source: 'Radiology 143(1):29–36', doi: '10.1148/radiology.143.1.7063747', topic: 'Prediction & validation' },
  { id: 'hastie2009', authors: 'Hastie T, Tibshirani R, Friedman J', year: 2009, title: 'The Elements of Statistical Learning, 2nd ed. (§7.10.2: the wrong and right way to do cross-validation)', source: 'Springer', doi: '10.1007/978-0-387-84858-7', topic: 'Prediction & validation' },
  { id: 'varma2006', authors: 'Varma S, Simon R', year: 2006, title: 'Bias in error estimation when using cross-validation for model selection', source: 'BMC Bioinformatics 7:91', doi: '10.1186/1471-2105-7-91', topic: 'Prediction & validation' },
  { id: 'bates2024', authors: 'Bates S, Hastie T, Tibshirani R', year: 2024, title: 'Cross-validation: what does it estimate and how well does it do it?', source: 'J Am Stat Assoc 119(546):1434–1445', doi: '10.1080/01621459.2023.2197686', topic: 'Prediction & validation' },
  { id: 'kapoor2023', authors: 'Kapoor S, Narayanan A', year: 2023, title: 'Leakage and the reproducibility crisis in machine-learning-based science', source: 'Patterns 4(9):100804', doi: '10.1016/j.patter.2023.100804', topic: 'Prediction & validation' },
  { id: 'riley2021', authors: 'Riley RD, Snell KIE, Martin GP, et al.', year: 2021, title: 'Penalization and shrinkage methods produced unreliable clinical prediction models especially when sample size was small', source: 'J Clin Epidemiol 132:88–96', doi: '10.1016/j.jclinepi.2020.12.005', topic: 'Prediction & validation' },
  { id: 'riley2021note', authors: 'Riley RD, Van Calster B, Collins GS', year: 2021, title: 'A note on estimating the Cox-Snell R2 from a reported C statistic (AUROC) to inform sample size calculations for developing a prediction model with a binary outcome', source: 'Stat Med 40(4):859–864', doi: '10.1002/sim.8806', topic: 'Prediction & validation' },
  { id: 'riley2021ext', authors: 'Riley RD, Debray TPA, Collins GS, et al.', year: 2021, title: 'Minimum sample size for external validation of a clinical prediction model with a binary outcome', source: 'Stat Med 40(19):4230–4251', doi: '10.1002/sim.9025', topic: 'Prediction & validation' },
  { id: 'collins2024', authors: 'Collins GS, Moons KGM, Dhiman P, et al.', year: 2024, title: 'TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods', source: 'BMJ 385:e078378', doi: '10.1136/bmj-2023-078378', topic: 'Prediction & validation' },
  { id: 'moons2025', authors: 'Moons KGM, Damen JAA, Kaul T, et al.', year: 2025, title: 'PROBAST+AI: an updated quality, risk of bias, and applicability assessment tool for prediction models using regression or artificial intelligence methods', source: 'BMJ 388:e082505', doi: '10.1136/bmj-2024-082505', topic: 'Prediction & validation' },

  // Resampling & inference
  { id: 'efron1993', authors: 'Efron B, Tibshirani RJ', year: 1993, title: 'An Introduction to the Bootstrap', source: 'Chapman & Hall/CRC', doi: '10.1201/9780429246593', topic: 'Resampling & inference' },
  { id: 'diciccio1996', authors: 'DiCiccio TJ, Efron B', year: 1996, title: 'Bootstrap confidence intervals', source: 'Stat Sci 11(3):189–228', doi: '10.1214/ss/1032280214', topic: 'Resampling & inference' },
  { id: 'greenland2016', authors: 'Greenland S, Senn SJ, Rothman KJ, et al.', year: 2016, title: 'Statistical tests, P values, confidence intervals, and power: a guide to misinterpretations', source: 'Eur J Epidemiol 31:337–350', doi: '10.1007/s10654-016-0149-3', topic: 'Resampling & inference' },
  { id: 'wasserstein2016', authors: 'Wasserstein RL, Lazar NA', year: 2016, title: "The ASA's statement on p-values: context, process, and purpose", source: 'Am Stat 70(2):129–133', doi: '10.1080/00031305.2016.1154108', topic: 'Resampling & inference' },
  { id: 'morris2019', authors: 'Morris TP, White IR, Crowther MJ', year: 2019, title: 'Using simulation studies to evaluate statistical methods', source: 'Stat Med 38(11):2074–2102', doi: '10.1002/sim.8086', topic: 'Resampling & inference' },

  // Reproducibility & reporting
  { id: 'nasem2019', authors: 'National Academies of Sciences, Engineering, and Medicine', year: 2019, title: 'Reproducibility and Replicability in Science', source: 'National Academies Press', doi: '10.17226/25303', topic: 'Reproducibility & reporting' },
  { id: 'sandve2013', authors: 'Sandve GK, Nekrutenko A, Taylor J, Hovig E', year: 2013, title: 'Ten simple rules for reproducible computational research', source: 'PLoS Comput Biol 9(10):e1003285', doi: '10.1371/journal.pcbi.1003285', topic: 'Reproducibility & reporting' },
  { id: 'peng2011', authors: 'Peng RD', year: 2011, title: 'Reproducible research in computational science', source: 'Science 334(6060):1226–1227', doi: '10.1126/science.1213847', topic: 'Reproducibility & reporting' },
  { id: 'gelman2014', authors: 'Gelman A, Loken E', year: 2014, title: 'The statistical crisis in science', source: 'Am Sci 102(6):460', doi: '10.1511/2014.111.460', topic: 'Reproducibility & reporting' },
  { id: 'simonsohn2020', authors: 'Simonsohn U, Simmons JP, Nelson LD', year: 2020, title: 'Specification curve analysis', source: 'Nat Hum Behav 4:1208–1214', doi: '10.1038/s41562-020-0912-z', topic: 'Reproducibility & reporting' },
  { id: 'vonelm2007', authors: 'von Elm E, Altman DG, Egger M, et al.', year: 2007, title: 'The Strengthening the Reporting of Observational Studies in Epidemiology (STROBE) statement', source: 'Lancet 370:1453–1457', doi: '10.1016/S0140-6736(07)61602-X', topic: 'Reproducibility & reporting' },
  { id: 'benchimol2015', authors: 'Benchimol EI, Smeeth L, Guttmann A, et al.', year: 2015, title: 'The REporting of studies Conducted using Observational Routinely-collected health Data (RECORD) statement', source: 'PLoS Med 12(10):e1001885', doi: '10.1371/journal.pmed.1001885', topic: 'Reproducibility & reporting' },
  { id: 'hopewell2025', authors: 'Hopewell S, Chan AW, Collins GS, et al.', year: 2025, title: 'CONSORT 2025 statement: updated guideline for reporting randomised trials', source: 'BMJ 389:e081123', doi: '10.1136/bmj-2024-081123', topic: 'Reproducibility & reporting' },
  { id: 'chan2025', authors: 'Chan AW, Boutron I, Hopewell S, et al.', year: 2025, title: 'SPIRIT 2025 statement: updated guideline for protocols of randomised trials', source: 'BMJ 389:e081477', doi: '10.1136/bmj-2024-081477', topic: 'Reproducibility & reporting' },
  { id: 'cashin2025', authors: 'Cashin AG, Hansford HJ, Hernán MA, et al.', year: 2025, title: 'Transparent reporting of observational studies emulating a target trial: the TARGET Statement', source: 'BMJ e087179', doi: '10.1136/bmj-2025-087179', topic: 'Reproducibility & reporting' },
  { id: 'gallifant2025', authors: 'Gallifant J, Afshar M, Ameen S, et al.', year: 2025, title: 'The TRIPOD-LLM reporting guideline for studies using large language models', source: 'Nat Med 31(1)', doi: '10.1038/s41591-024-03425-5', topic: 'Reproducibility & reporting' },
  { id: 'bossuyt2015', authors: 'Bossuyt PM, Reitsma JB, Bruns DE, et al.', year: 2015, title: 'STARD 2015: an updated list of essential items for reporting diagnostic accuracy studies', source: 'BMJ 351:h5527', doi: '10.1136/bmj.h5527', topic: 'Reproducibility & reporting' },
  { id: 'husereau2022', authors: 'Husereau D, Drummond M, Augustovski F, et al.', year: 2022, title: 'Consolidated Health Economic Evaluation Reporting Standards 2022 (CHEERS 2022) statement: updated reporting guidance for health economic evaluations', source: 'BMJ 376:e067975', doi: '10.1136/bmj-2021-067975', topic: 'Reproducibility & reporting' },
  { id: 'lang2015', authors: 'Lang TA, Altman DG', year: 2015, title: 'Basic statistical reporting for articles published in biomedical journals: the "Statistical Analyses and Methods in the Published Literature" or the SAMPL guidelines', source: 'Int J Nurs Stud 52(1):5–9', doi: '10.1016/j.ijnurstu.2014.09.006', topic: 'Reproducibility & reporting' },
  { id: 'equator', authors: 'EQUATOR Network', year: 2025, title: 'Library of reporting guidelines for health research', source: 'equator-network.org', url: 'https://www.equator-network.org/reporting-guidelines/', topic: 'Reproducibility & reporting' },
];

export const refById = new Map(references.map((r) => [r.id, r]));
