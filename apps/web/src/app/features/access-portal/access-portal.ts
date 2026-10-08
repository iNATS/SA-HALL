import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { PublicHeader } from '../../shared/public-header/public-header';

@Component({
  selector: 'app-access-portal',
  imports: [MatButtonModule, RouterLink, PublicHeader],
  templateUrl: './access-portal.html',
  styleUrl: './access-portal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessPortal {}
