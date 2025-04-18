
# Mindful Investing Companion

A web-based stock analysis app designed to empower individual investors with data-driven insights and psychological tools for rational decision-making.

## Project Overview

The Mindful Investing Companion helps users focus on stock fundamentals, filter market noise, and simulate trades. The app is inspired by platforms like Qualtrim.com that use data visualization to drive investment decisions.

## Key Features

- **Insights Page**: Interactive D3.js charts for financial metrics (Price, Revenue, EBITDA)
- **Focus Mode**: Filter news and press releases to reduce market noise
- **Portfolios**: Track trades and monitor performance
- **Earnings Calendar**: Track upcoming earnings reports and conference calls
- **Decision Dashboard**: Monitor decision quality metrics and track your progress
- **Badges**: Earn rewards for developing good investing habits

## Tech Stack

- React.js with TypeScript
- Tailwind CSS for styling
- D3.js for interactive charts
- shadcn/ui component library
- React Router for navigation

## Database Schema

The app is designed to work with the following database tables:

- **stocks**: Cache financial data like price, revenue, EBITDA
- **news**: Store news and press releases for sentiment analysis
- **portfolios**: Store user trade entries (ticker, shares, price)
- **trade_decisions**: Store Decision Coach outcomes (ticker, buy/sell, score)
- **badges**: Store user rewards (badge name, date earned)

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`

## Future Development

This is an iterative project that will be built step-by-step. Future enhancements include:

- Integration with financial APIs (Financial Modeling Prep, NewsAPI)
- AI-powered bias detection using Gemini/OpenAI
- Stripe integration for subscription management
- Enhanced data visualization and charting tools

## Subscription Model

In the future, the app will offer a 14-day free trial followed by a $10/month subscription for full access to all features.

