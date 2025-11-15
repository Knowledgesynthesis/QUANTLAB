# QuantLab - Advanced Methods for Clinician-Scientists

**A mobile-first, offline-capable educational platform teaching the complete research data pipeline.**

## Overview

QuantLab is an interactive learning platform designed to teach clinician-scientists the entire research data pipeline, from raw data through cleaning, imputation, modeling, diagnostics, and validation to manuscript-ready insights.

## Features

- 📱 **Mobile-First Design** - Optimized for learning on any device
- 🌙 **Dark Mode** - Easy on the eyes during long study sessions
- 📴 **Offline Capable** - Learn anywhere with PWA technology
- 📊 **Interactive Visualizations** - Hands-on learning with Recharts
- 🧪 **Synthetic Datasets** - Practice with realistic but safe data
- ✅ **Evidence-Based** - All content is statistically accurate and methodologically sound
- 🎯 **Comprehensive** - Covers the full research workflow

## Learning Modules

### 1. Raw Data Foundations (Beginner)
Learn to import, audit, and understand different types of messy data with data dictionaries.

### 2. Cleaning & Preprocessing (Beginner)
Master data cleaning techniques including deduplication, outlier handling, and transformations.

### 3. Missing Data & Imputation (Intermediate)
Understand missingness mechanisms (MCAR/MAR/MNAR) and apply appropriate imputation strategies.

### 4. Regression Diagnostics (Intermediate)
Perform comprehensive regression diagnostics including residuals, leverage, and influence analysis.

### 5. Multicollinearity Analysis (Intermediate)
Detect and handle multicollinearity using VIF, correlation matrices, and condition indices.

### 6. Validation & Reproducibility (Advanced)
Learn cross-validation, bootstrapping, and reproducibility best practices for research.

### 7. Integrated Pipeline Sandbox (Advanced)
Build complete end-to-end research data pipelines from cleaning to validation.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Visualizations**: Recharts
- **Routing**: React Router
- **PWA**: vite-plugin-pwa with Workbox
- **Offline Storage**: IndexedDB

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Project Structure

```
QUANTLAB/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components (Header, Sidebar, etc.)
│   │   └── modules/      # Module-specific components
│   ├── data/             # Module metadata and content
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
└── index.html            # HTML entry point
```

## Key Principles

### Educational Philosophy

- **Evidence-Based**: All content is grounded in established research methodology
- **Interactive**: Learn by doing with hands-on simulations
- **Progressive**: Modules build on each other systematically
- **Accessible**: WCAG 2.2 AA compliant for all learners
- **Transparent**: Methods are clearly explained and justified

### Technical Philosophy

- **Offline-First**: Full functionality without internet
- **Performance**: Fast load times and smooth interactions
- **Type Safety**: Comprehensive TypeScript coverage
- **Accessibility**: Keyboard navigation and screen reader support
- **Reproducibility**: Clear code organization and documentation

## Learning Objectives

By completing QuantLab, learners will be able to:

1. Systematically audit and document raw research data
2. Apply appropriate data cleaning and transformation techniques
3. Classify missingness mechanisms and select imputation strategies
4. Perform comprehensive regression diagnostics
5. Detect and handle multicollinearity
6. Validate models using cross-validation and bootstrapping
7. Follow reproducibility best practices
8. Build complete, transparent research data pipelines

## Target Audience

- Medical students (MS3-MS4)
- Residents and fellows
- Attending clinicians conducting research
- Clinical researchers and QI teams
- Anyone analyzing clinical or biomedical data

## Reporting Standards Covered

- **STROBE**: Strengthening the Reporting of Observational Studies in Epidemiology
- **TRIPOD**: Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis
- **EQUATOR**: Enhancing the QUAlity and Transparency Of health Research
- **PROBAST**: Prediction model Risk Of Bias ASsessment Tool

## Contributing

This is an educational project. Contributions should maintain:
- Statistical accuracy
- Methodological orthodoxy
- Clear, accessible explanations
- Evidence-based content

## License

Copyright © 2024 QuantLab. All rights reserved.

## Acknowledgments

Built following best practices in:
- Biostatistics education
- Data science pedagogy
- Research reproducibility
- Clinical research methodology
- User experience design

## Disclaimer

QuantLab is for educational purposes only. It does not provide medical advice or clinical decision support. All datasets are synthetic and for learning purposes only.

---

**QuantLab** - Making research data analysis transparent, reproducible, and accessible.
