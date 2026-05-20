import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { NewSurvey } from './pages/new-survey/new-survey';
import { SurveyDetail } from './pages/survey-detail/survey-detail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'new', component: NewSurvey },
  { path: 'survey/:id', component: SurveyDetail },
  { path: '**', redirectTo: '' },
];
