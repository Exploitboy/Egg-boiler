import { Link } from 'react-router-dom';
import { useSession } from 'modelence/client';
import { Egg, Timer, Info, History, ChefHat } from 'lucide-react';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/client/components/ui/Card';

export default function HomePage() {
  const { user } = useSession();

  return (
    <Page className="bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-100 mb-6">
            <Egg className="w-12 h-12 text-amber-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Egg Boiler Timer</h1>
          <p className="text-xl text-gray-600 max-w-lg mx-auto">
            Get perfectly boiled eggs every time. Choose your preferred doneness and let us handle the timing.
          </p>
        </div>

        {/* CTA Button */}
        <Link to="/boiler">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white text-lg px-8 py-6 h-auto">
            <ChefHat className="w-6 h-6 mr-2" />
            Start Cooking
          </Button>
        </Link>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 w-full">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Timer className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle>Precise Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose from jelly yolk, semi-hard, or hard boiled. Perfect results every time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <Info className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle>Nutrition Info</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track calories, protein, vitamins, and more based on how many eggs you're cooking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <History className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle>Cooking History</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sign in to save your cooking sessions and track your egg-cellent progress.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Sign in prompt */}
        {!user && (
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Create an account to save your cooking history
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">Sign Up</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
