
import { Brain, Target, Calendar, TrendingUp, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CoachView = () => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête de bienvenue */}
      <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Votre Coach IA Personnalisé
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Un entraînement intelligent adapté à vos performances, objectifs et disponibilités
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
          <Zap className="h-4 w-4" />
          Prochainement disponible
        </div>
      </div>

      {/* Grille des fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Analyse des performances */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Analyse des Performances</CardTitle>
                <CardDescription>
                  Étude approfondie de vos courses passées
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Analyse des allures et progression</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Suivi de la fréquence cardiaque</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Évaluation de la charge d'entraînement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Détection des patterns de fatigue</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration des objectifs */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Objectifs Personnalisés</CardTitle>
                <CardDescription>
                  Définissez vos ambitions et échéances
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Choix du type d'épreuve (5K, 10K, semi, marathon)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Objectif de temps ou d'allure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Date cible de l'épreuve</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Niveau d'expérience et historique</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planification des séances */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Planification Intelligente</CardTitle>
                <CardDescription>
                  Un programme adapté à votre emploi du temps
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Nombre de séances par semaine</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Créneaux préférés d'entraînement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Alternance travail/récupération</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Adaptation selon la progressivité</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suivi du ressenti */}
        <Card className="border-gray-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Suivi du Ressenti</CardTitle>
                <CardDescription>
                  Votre forme et fatigue au quotidien
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Échelle de fatigue perçue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Qualité de sommeil et récupération</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Motivation et état d'esprit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>Ajustement automatique du programme</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section d'information */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Intelligence Artificielle Dédiée à la Course
            </h3>
            <p className="text-gray-600 mb-4 max-w-3xl mx-auto">
              Notre IA analyse en permanence vos données de course pour vous proposer des entraînements 
              personnalisés qui évoluent avec vos progrès. Chaque séance est calibrée selon votre forme 
              du moment et vos objectifs à long terme.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Algorithmes d'apprentissage automatique</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Adaptation en temps réel</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span>Prévention des blessures</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachView;
