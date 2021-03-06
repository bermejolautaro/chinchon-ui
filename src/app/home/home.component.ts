import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
<<<<<<< Updated upstream
=======
import { environment } from 'src/environments/environment';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
  private endpoint: string = 'http://localhost:5000/api/rest/chinchon';
=======
  private endpoint: string = `${environment.apiUrl}/api/rest/chinchon`;
>>>>>>> Stashed changes
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
