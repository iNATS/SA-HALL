import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { loadIcons } from './app/shared/icon/icon';

// Request the icon set immediately so it arrives alongside the first screen's chunk.
void loadIcons();
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
