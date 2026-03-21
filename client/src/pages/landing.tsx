import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  School, 
  Shield, 
  TrendingUp, 
  Users, 
  FileText, 
  Key, 
  CheckCircle2,
  ArrowRight,
  UserPlus
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background"></div>
        <div className="relative">
          {/* Navigation */}
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold">
                  SR
                </div>
                <span className="text-xl font-bold">SmartResultChecker</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/check-result">
                  <Button variant="ghost" size="sm" data-testid="link-check-result">
                    Check Result
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="sm" data-testid="link-register">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" data-testid="link-login">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold mb-6">
                Transparent, Efficient School <span className="text-primary">Result Management</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Modern result management system with secure PIN-based result checking. 
                Perfect for schools looking to digitize their result workflow.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/check-result">
                  <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-check-result-hero">
                    <Key className="w-5 h-5" />
                    Check Your Result
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="button-register-hero">
                    <UserPlus className="w-5 h-5" />
                    Register Your School
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="ghost" className="gap-2 w-full sm:w-auto" data-testid="button-login-hero">
                    Login
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose SmartResultChecker?</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to manage school results efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Role System</h3>
            <p className="text-muted-foreground">
              Support for Super Admin, School Admin, and Teachers with role-specific dashboards
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-2/10 text-chart-2 mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure PIN System</h3>
            <p className="text-muted-foreground">
              One-time use PINs with expiry, attempt limits, and IP tracking for maximum security
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-4/10 text-chart-4 mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Auto Calculation</h3>
            <p className="text-muted-foreground">
              Automatic calculation of totals, averages, grades, and positions
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-1/10 text-chart-1 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Approval Workflow</h3>
            <p className="text-muted-foreground">
              Results go through draft → submitted → approved workflow for quality control
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-chart-5/10 text-chart-5 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for data-driven decisions
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <School className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-School Support</h3>
            <p className="text-muted-foreground">
              Manage multiple schools from a single platform with isolated data
            </p>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Transform your school result management today
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2" data-testid="button-register-cta">
                  <UserPlus className="w-5 h-5" />
                  Register Your School
                </Button>
              </Link>
              <Link href="/check-result">
                <Button size="lg" variant="outline" data-testid="button-check-result-cta">
                  Check Your Result
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2026 SmartResultChecker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
