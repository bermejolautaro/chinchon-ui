import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

interface CreateGameResponse {
  gameGuid: string;
  player1: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  private endpoint: string = `${environment.apiUrl}/api/rest/chinchon`;
  constructor(
    private http: HttpClient,
    private router: Router) { }

  ngOnInit(): void {
  }

  public onClickCreateGame(): void {
    this.http.post<CreateGameResponse>(`${this.endpoint}/game`, {}, { observe: 'response' }).subscribe(x => {
      this.router.navigate(['game', x.body?.gameGuid], { state: { playerId: x.body?.player1 } });
    });
  }

}
