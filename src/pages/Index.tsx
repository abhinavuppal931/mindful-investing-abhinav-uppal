import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, BarChart3, Shield, Target, TrendingUp, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
const Index = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-gradient-to-br from-mindful-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BrainCircuit className="h-8 w-8 text-mindful-600" />
            <span className="text-2xl font-bold text-foreground">Mindful Investing</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? <Link to="/insights">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link> : <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-mindful-100 text-mindful-700 hover:bg-mindful-200">
          14-Day Free Trial • No Credit Card Required
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
          Invest with{' '}
          <span className="text-mindful-600">Mindfulness</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Cut through market noise and emotional bias with our AI-powered platform. 
          Make rational investment decisions with advanced sentiment analysis and psychological tools.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? <Link to="/insights">
              <Button size="lg" className="px-8">
                Continue to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link> : <>
              <Link to="/auth">
                <Button size="lg" className="px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/insights">
                <Button variant="outline" size="lg" className="px-8">
                  Explore Features
                </Button>
              </Link>
            </>}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Powerful Features for Mindful Investors
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to make informed, rational investment decisions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Stock Insights</CardTitle>
              <CardDescription>Interactive charts with comprehensive financial metrics and AI-generated analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Real-time financial data
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI company analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Interactive visualizations
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <BrainCircuit className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Focus Mode</CardTitle>
              <CardDescription>
                Filter market noise with FinBERT sentiment analysis and AI-powered content scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Sentiment analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Noise filtering
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  High-signal content
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Bias-Busting Coach</CardTitle>
              <CardDescription>
                Detect emotional biases in your trading decisions with psychological assessment tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Emotional state tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Bias detection
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Decision scoring
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Target className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Portfolio Tracking</CardTitle>
              <CardDescription>
                Manage multiple portfolios with detailed trade tracking and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Multiple portfolios
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Trade history
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Performance metrics
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Earnings Intelligence</CardTitle>
              <CardDescription>
                AI-generated earnings call summaries and comprehensive earnings calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Earnings calendar
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI summaries
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Key insights
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-mindful-100 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-mindful-600 mb-4" />
              <CardTitle>Decision Dashboard</CardTitle>
              <CardDescription>
                Track your progress with gamified badges and weekly rationality statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Progress tracking
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Achievement badges
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Weekly stats
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-mindful-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Invest Mindfully?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of investors making smarter, more rational decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? <Link to="/insights">
                  <Button size="lg" variant="secondary" className="px-8">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link> : <>
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="px-8">
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Badge className="self-center bg-white/20 text-white hover:bg-white/30">
                    $10/month after trial
                  </Badge>
                </>}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BrainCircuit className="h-6 w-6 text-mindful-600" />
            <span className="text-xl font-bold text-foreground">Mindful Investing</span>
          </div>
          <p className="text-muted-foreground">
            Empowering rational investment decisions through mindful technology
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;