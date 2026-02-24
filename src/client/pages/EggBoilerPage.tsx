import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'modelence/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modelenceQuery, modelenceMutation, createQueryKey } from '@modelence/react-query';
import { Link } from 'react-router-dom';
import { Egg, Timer, Minus, Plus, Play, Pause, RotateCcw, History, Info } from 'lucide-react';
import Page from '@/client/components/Page';
import { Button } from '@/client/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { cn } from '@/client/lib/utils';

type EggType = 'jelly-yolk' | 'semi-hard' | 'hard';

type EggTypeInfo = {
  name: string;
  time: number;
  description: string;
};

type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cholesterol: number;
  vitaminA: number;
  vitaminD: number;
  vitaminB12: number;
  selenium: number;
  choline: number;
};

type Session = {
  _id: string;
  eggType: string;
  eggCount: number;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
};

const EGG_TYPES: Record<EggType, EggTypeInfo> = {
  'jelly-yolk': { name: 'Jelly Yolk', time: 360, description: 'Runny yolk, set white' },
  'semi-hard': { name: 'Semi-Hard', time: 480, description: 'Jammy yolk, firm white' },
  hard: { name: 'Hard Boiled', time: 600, description: 'Fully set yolk and white' },
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function EggBoilerPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<EggType>('semi-hard');
  const [eggCount, setEggCount] = useState(2);
  const [timeRemaining, setTimeRemaining] = useState(EGG_TYPES['semi-hard'].time);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: nutrition } = useQuery({
    ...modelenceQuery<Nutrition>('eggBoiler.getNutrition', { eggCount }),
  });

  const { data: recentSessions } = useQuery({
    ...modelenceQuery<Session[]>('eggBoiler.getRecentSessions', {}),
    enabled: !!user && showHistory,
  });

  const { mutate: startSession } = useMutation({
    ...modelenceMutation<{ sessionId: string }>('eggBoiler.startSession'),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
    },
  });

  const { mutate: completeSession } = useMutation({
    ...modelenceMutation('eggBoiler.completeSession'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createQueryKey('eggBoiler.getRecentSessions', {}) });
    },
  });

  // Update time when egg type changes
  useEffect(() => {
    if (!isRunning) {
      setTimeRemaining(EGG_TYPES[selectedType].time);
    }
  }, [selectedType, isRunning]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      setIsRunning(false);
      if (sessionId) {
        completeSession({ sessionId });
      }
      // Play a sound or show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Eggs are ready!', {
          body: `Your ${EGG_TYPES[selectedType].name} eggs are done!`,
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, sessionId, selectedType, completeSession]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    if (user) {
      startSession({ eggType: selectedType, eggCount });
    }
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [user, startSession, selectedType, eggCount]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(EGG_TYPES[selectedType].time);
    setSessionId(null);
  }, [selectedType]);

  const incrementEggs = () => setEggCount((prev) => Math.min(prev + 1, 12));
  const decrementEggs = () => setEggCount((prev) => Math.max(prev - 1, 1));

  const progress = ((EGG_TYPES[selectedType].time - timeRemaining) / EGG_TYPES[selectedType].time) * 100;

  return (
    <Page className="bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-4xl mx-auto w-full py-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
            <Egg className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Egg Boiler Timer</h1>
          <p className="text-gray-600 mt-2">Perfect eggs, every time</p>
        </div>

        {!user && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <p className="text-center text-amber-800">
                <Link to="/login" className="font-semibold underline hover:text-amber-900">
                  Sign in
                </Link>{' '}
                to save your cooking history
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Timer Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5" />
                Timer
              </CardTitle>
              <CardDescription>Select your preferred doneness</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Egg Type Selection */}
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(EGG_TYPES) as EggType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => !isRunning && setSelectedType(type)}
                    disabled={isRunning}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all text-center',
                      selectedType === type
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300',
                      isRunning && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="font-medium text-sm">{EGG_TYPES[type].name}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatTime(EGG_TYPES[type].time)}</div>
                  </button>
                ))}
              </div>

              {/* Timer Display */}
              <div className="relative">
                <div className="w-48 h-48 mx-auto rounded-full border-8 border-gray-100 relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-400 to-amber-300 transition-all duration-1000"
                    style={{ height: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{formatTime(timeRemaining)}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {timeRemaining === 0 ? 'Done!' : isRunning ? 'Cooking...' : 'Ready'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-3">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    disabled={timeRemaining === 0}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="outline" size="lg">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Egg Count & Nutrition Section */}
          <div className="space-y-6">
            {/* Egg Counter */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Egg className="w-5 h-5" />
                  Egg Count
                </CardTitle>
                <CardDescription>How many eggs are you boiling?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementEggs}
                    disabled={eggCount <= 1}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-amber-600">{eggCount}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {eggCount === 1 ? 'egg' : 'eggs'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementEggs}
                    disabled={eggCount >= 12}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                {/* Visual egg display */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {Array.from({ length: eggCount }).map((_, i) => (
                    <Egg key={i} className="w-6 h-6 text-amber-400" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Nutritional Info */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Nutrition Facts
                </CardTitle>
                <CardDescription>
                  For {eggCount} {eggCount === 1 ? 'egg' : 'eggs'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nutrition && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Calories</span>
                      <span className="font-semibold">{nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-semibold">{nutrition.protein}g</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Fat</span>
                      <span className="font-semibold">{nutrition.fat}g</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Carbs</span>
                      <span className="font-semibold">{nutrition.carbs}g</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Cholesterol</span>
                      <span className="font-semibold">{nutrition.cholesterol}mg</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Vitamin A</span>
                      <span className="font-semibold">{nutrition.vitaminA} IU</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Vitamin D</span>
                      <span className="font-semibold">{nutrition.vitaminD} IU</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Vitamin B12</span>
                      <span className="font-semibold">{nutrition.vitaminB12}mcg</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Selenium</span>
                      <span className="font-semibold">{nutrition.selenium}mcg</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-600">Choline</span>
                      <span className="font-semibold">{nutrition.choline}mg</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Section (for logged in users) */}
        {user && (
          <Card className="mt-6 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Cooking History
                  </CardTitle>
                  <CardDescription>Your recent egg cooking sessions</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showHistory && (
              <CardContent>
                {recentSessions && recentSessions.length > 0 ? (
                  <div className="space-y-2">
                    {recentSessions.map((session) => (
                      <div
                        key={session._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Egg className="w-5 h-5 text-amber-500" />
                          <div>
                            <div className="font-medium">
                              {EGG_TYPES[session.eggType as EggType]?.name || session.eggType}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.eggCount} {session.eggCount === 1 ? 'egg' : 'eggs'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {session.completedAt ? 'Completed' : 'In progress'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No cooking sessions yet</p>
                )}
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}
