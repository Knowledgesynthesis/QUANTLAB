# **QUANTLAB — OPTIMIZED MASTER PROMPT FOR EDUCATIONAL APP GENERATION**  
A clinically rigorous, evidence-based master prompt for generating a **mobile-first, offline-capable, dark-mode educational app** that teaches clinician-scientists the *entire research data pipeline*: from raw data → cleaning → imputation → modeling → diagnostics → reproducibility → manuscript-ready insights.

---

# **MASTER PROMPT — QuantLab Educational App Generator (SPECIALIZED VERSION)**

## **Role & Mission**
You are a cross-functional team (PM + Staff Engineer + Senior Instructional Designer + Biostatistics SME + Data Science SME + Research Reproducibility Specialist + UX Writer + QA).  
Your mission is to design an **interactive data science and advanced biostatistics teaching platform** that explains:

**QuantLab: Advanced Methods for Clinician-Scientists**  
—A deep-dive, end-to-end learning environment that teaches clinicians how to prepare, analyze, validate, and report research data with scientific rigor and reproducibility.

This app must:
- Support **all learner levels:** MS3 → MS4 → residents → fellows → attending clinicians → clinical researchers  
- Cover **real-world research workflow** needs, including data cleaning, transformations, missing data strategies, regression diagnostics, multicollinearity, bootstrapping, cross-validation, reproducibility standards  
- Maintain full **statistical correctness**, with no hallucinated formulas or impossible methods  
- Use **synthetic datasets only**  
- Be mobile-first, offline-ready, and safe for educational use  
- Emphasize transparency, reproducibility, and robust methodology  
- Provide a mix of **interactive and static conceptual visualizations**  

Your output must be **evidence-based, cohesive, and methodologically sound** across biostatistics, data science, and reproducibility science.

---

## **Inputs (Fill These)**
- **Primary Topic(s):**  
  Always centered on **data science for clinician-scientists**, including:  
  - Data cleaning, preprocessing, transformations  
  - Missing data (MCAR, MAR, MNAR), imputation strategies  
  - Regression diagnostics (residual plots, leverage vs influence, Cook’s distance)  
  - Multicollinearity (VIF, condition indices, correlation structures)  
  - Model validation (bootstrapping, k-fold cross-validation)  
  - Reproducibility (code organization, version control, documentation)  
  - Robust statistical thinking for manuscript preparation  
- **Target Learner Levels:** {{LEVELS}}  
  - e.g., “Residents, fellows, clinician-scientists, QI researchers”
- **Learner Context:** {{CONTEXT}}  
  - e.g., “Manuscript data prep, QI analysis, clinical prediction model development”
- **Learning Outcomes (SMART + Bloom):** {{LEARNING_OBJECTIVES}}  
  - e.g., “Clean and transform data; classify missingness; apply imputation; perform regression diagnostics; implement validation; assess reproducibility”
- **Constraints/Preferences:**  
  Always include:  
  - *Mobile-first; dark mode; offline-ready; synthetic data only; no clinical predictions; methodologically orthodox*  
- **References/Standards:** {{REFERENCES}}  
  - e.g., “STROBE, TRIPOD, EQUATOR, PROBAST, reproducibility literature”
- **Brand/Voice:** {{VOICE_TONE}}  
  - e.g., “Research-focused, clear, clinically grounded, advanced yet accessible”
- **Localization/Regional Needs:** {{LOCALE}}

---

# **Required Deliverables (Produce All)**

---

## **1. Executive Summary**
- Explain why clinician-scientists struggle with data cleaning, missing data, diagnostics, and reproducibility.  
- Introduce QuantLab as the **Research Pipeline Simulator + Diagnostics Lab + Reproducibility Engine**.  
- Provide 2–3 alternative name options + crisp value propositions.

---

## **2. Learner Personas & Use Cases**
Examples:
- Resident prepping a dataset for a retrospective study  
- Fellow validating a prediction model  
- Clinician writing the methods section of a manuscript  
- Research coordinator handling messy EHR extracts  
Use cases: research design, data preprocessing, statistical diagnostics, reproducibility compliance.

---

## **3. Curriculum Map & Knowledge Graph**
Everything must connect **Biostatistics ↔ Data Science ↔ Research Reproducibility**.

### **Prerequisites**
- Variable types  
- Distributions  
- Regression basics  
- Statistical assumptions  

### **Modules**
1. **Raw Data Foundations**  
   - Types of messy data  
   - Importing & auditing synthetic data  
   - Data dictionaries  

2. **Cleaning & Preprocessing**  
   - Deduplication  
   - Outlier consideration  
   - Winsorizing, transformations (log, sqrt)  
   - Categorical encoding  

3. **Missing Data & Imputation**  
   - MCAR/MAR/MNAR  
   - Visual diagnostics (missingness maps)  
   - Simple vs multivariate imputation  
   - Pitfalls & assumptions  

4. **Regression Diagnostics**  
   - Residuals, QQ plots  
   - Influence diagnostics  
   - Cook’s distance  
   - Heteroscedasticity checks  
   - Remedies  

5. **Multicollinearity Analysis**  
   - Correlation matrix explorer  
   - Variance inflation factors  
   - Condition indices  
   - Interactions & polynomial terms  

6. **Validation & Reproducibility**  
   - Train/validation/test splits  
   - Cross-validation (k-fold)  
   - Bootstrapping  
   - Overfitting vs generalization  
   - Code reproducibility, version control, documentation  
   - Reporting standards  

7. **Integrated Research Pipeline Sandbox**  
   - Clean synthetic data → impute → build model → perform diagnostics → validate → produce manuscript-ready summary  

Each module: micro-concepts, Bloom levels, prerequisites, cross-links.

---

## **4. Interactives (QuantLab-Specific)**

### **Examples**
- **Missingness Map Explorer**  
  - Toggle missingness patterns → classify MCAR/MAR/MNAR  

- **Imputation Playground**  
  - Select imputation method → compare distributions pre/post  

- **Transformations Lab**  
  - Apply log/sqrt transformations → see distribution shift  

- **Diagnostic Dashboard**  
  - Interactive residual plots, leverage points, influence curves  

- **Multicollinearity Visualizer**  
  - Interactive VIF display and correlation heatmap  

- **Cross-Validation Simulator**  
  - Adjust k → see variance/bias tradeoff  

- **Bootstrapping Demo**  
  - Visualize resampling and confidence interval generation  

- **Pipeline Builder**  
  - Stepwise clean → transform → impute → model → diagnose → validate  

For each interactive:
- purpose  
- inputs & controls  
- outputs  
- visualizations  
- preset synthetic cases  
- guardrails for statistical correctness  

---

## **5. Assessment & Mastery**
Item types:
- Identify missing data mechanisms  
- Choose appropriate imputation  
- Interpret regression diagnostics  
- Detect multicollinearity  
- Compare validation strategies  
- Evaluate reproducibility compliance  
Provide **10–20 items** with rationales.

---

## **6. Research Data Reasoning Framework**
Teach systematic thinking:
1. Audit data  
2. Clean & transform  
3. Assess missingness  
4. Apply imputation strategies  
5. Fit model  
6. Perform diagnostics  
7. Validate (cross-validation/bootstrapping)  
8. Ensure reproducibility  
9. Write results in a transparent, defensible way  

Pitfalls:
- Misclassifying missingness  
- Over-transforming  
- Ignoring influence diagnostics  
- Using VIF incorrectly  
- Misunderstanding cross-validation  
- Under-documenting methods  

---

## **7. Accessibility & Safety**
- WCAG 2.2 AA  
- Synthetic datasets only  
- No real clinical predictions  
- No IRB-dependent processes  
- Clear disclaimers  
- Statistically orthodox, no nonstandard approaches  

---

## **8. Tech Architecture (Mobile-First, Offline)**
- React/TypeScript  
- Tailwind + shadcn/ui  
- Recharts/D3 for diagnostics plots  
- IndexedDB + Service Worker for offline use  
- State management (Zustand/Redux)  
- Lightweight simulation engines  

---

## **9. Data Schemas (JSON)**
Schemas for:
- synthetic dataset  
- missingness patterns  
- imputation strategies  
- diagnostic results  
- VIF & matrices  
- validation results  
- pipeline configurations  
- glossary terms  

Include representative examples.

---

## **10. Screen Specs & Text Wireframes**
Screens:
- Home  
- Raw Data Audit  
- Cleaning Lab  
- Missing Data Lab  
- Transformation Lab  
- Regression Diagnostics  
- Multicollinearity Explorer  
- Validation Center  
- Pipeline Sandbox  
- Assessment Hub  
- Glossary  
- Settings  

Include text wireframes.

---

## **11. Copy & Content Kit**
Include:
- Microcopy (“MCAR vs MAR vs MNAR”, “VIF explained”, “Bootstrapping intuition”)  
- Diagram labels  
- Glossary definitions  
- Two full lessons + one integrated case  

---

## **12. Analytics & A/B Plan**
UI-only:
- Missingness visualization styles  
- Diagnostic plot layouts  
- Pipeline builder navigation  
No statistical experiments.

---

## **13. QA Checklist**
- Statistical logic consistent with standard textbooks  
- No contradictory diagnostic interpretations  
- Imputation methods correctly described  
- VIF & multicollinearity rules validated  
- Validation methods canonical  
- Reproducibility aligned with guidelines  

---

## **14. Roadmap**
Prototype → Pilot → Extended Diagnostics Module → Reproducibility Enhancements → Personalized Learning Tracks  
Include milestones, risks, acceptance criteria.

---

# **Style & Rigor Requirements**
- Transparent, reproducible, clinically grounded  
- Evidence-based & statistically accurate  
- Intuitive yet advanced  
- No statistical hallucinations  
- Pathoma-like clarity for data science  

---

# **Acceptance Criteria**
- Learner can execute a full research data pipeline  
- All content is reproducible and orthodox  
- No contradictions across modules  
- QuantLab reinforces a unified **Research Data Systems Map**

---

# **Now Generate**
Using the inputs above, produce all deliverables in the required order.  
If any inputs are missing, make biostatistically sound assumptions and label them as defaults.
