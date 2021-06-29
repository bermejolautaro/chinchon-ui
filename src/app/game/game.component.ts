import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, filter, mergeMap, tap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { interval, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

interface HttpGenericErrorResponse<T> extends HttpErrorResponse {
  error: T
}

interface Card {
  suit: number;
  rank: number;
}

interface CutDto {
  firstGroup: Card[];
  secondGroup: Card[];
  cardToCutWith: Card | null;
}

interface Player {
  id: number;
  points: number;
  cards: Card[];
  isPlayerTurn: boolean;
  topCardInPile: Card;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  private gameId: string;
  private playerId: string | null = null;
  private restEndpoint: string = `${environment.apiUrl}/api/rest/chinchon`;
  private rpcEndpoint: string = `${environment.apiUrl}/api/rpc/chinchon`;


  public shareLink: string;
  public player: Player | null = null;
  public firstGroup: Card[] = [];
  public secondGroup: Card[] = [];
  public selectedCard: Card | null = null;


  constructor(
    private http: HttpClient,
    router: Router,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    @Inject(DOCUMENT) document: Document) {
    this.gameId = route.snapshot.url[1].toString();
    this.playerId = router.getCurrentNavigation()?.extras.state?.playerId;

    if (!this.playerId) {
      const stringifyPlayerId = localStorage.getItem(this.gameId);
      if (stringifyPlayerId) {
        this.playerId = JSON.parse(stringifyPlayerId);
      }
    }

    this.shareLink = `${document.location.host}/${route.snapshot.url.join('/')}`;

    interval(3000).pipe(
      filter(_ => {
        return !!(this.player && !this.player.isPlayerTurn);
      }),
      mergeMap(_ => {
        return this.http.get<Player>(`${this.restEndpoint}/game/${this.gameId}/players/${this.playerId}`).pipe(
          catchError(_ => of(null))
        );
      })
    ).subscribe(player => {
      if (!this.player || !player) {
        return;
      }

      if(!GameComponent.equals(this.getAllCards(), player.cards)) {
        this.player.cards = player.cards;
      }

      this.player.topCardInPile = player.topCardInPile;
      this.player.isPlayerTurn = player.isPlayerTurn;
    });
  }

  private static sortCards(cards: Card[], sortBy: Card[]): Card[] {
    const result: Card[] = new Array(8);
    const leftover: Card[] = [];

    for (const card of cards) {
      const index = sortBy.findIndex(x => x.rank === card.rank && x.suit === card.suit);
      if (index === -1) {
        leftover.push(card);
      } else {
        result[index] = card;
      }
    }

    return result.filter(x => !!x).concat(leftover);
  }

  private static equals(arr1: Card[], arr2: Card[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for(const card of arr1) {
      if(!arr2.find(x => x.rank === card.rank && x.suit === card.suit)) {
        return false;
      }
    }

    return true;
  }

  public ngOnInit(): void {

    this.shareLink = `${document.location.host}/${this.route.snapshot.url.join('/')}`;
    if (!this.playerId) {
      this.http.get<string>(`${this.restEndpoint}/game/${this.gameId}/player-key`).pipe(
        tap(playerId => {
          this.playerId = playerId;
        }),
        mergeMap(_ => {
          return this.http.get<Player>(`${this.restEndpoint}/game/${this.gameId}/players/${this.playerId}`);
        })
      )
        .subscribe(player => {
          this.player = player;
          localStorage.setItem(this.gameId, JSON.stringify(this.playerId));
        });
    } else {
      this.http.get<Player>(`${this.restEndpoint}/game/${this.gameId}/players/${this.playerId}`).subscribe(player => {
        this.player = player;
        localStorage.setItem(this.gameId, JSON.stringify(this.playerId));
      });
    }
  }

  public onClickCard(cardIndex: number): void {
    if (!this.player) {
      return;
    }

    if (this.selectedCard === this.player.cards[cardIndex]) {
      this.selectedCard = null;
    } else {
      this.selectedCard = this.player.cards[cardIndex];
    }

  }

  public drop(event: CdkDragDrop<Card[]>): void {
    if (!this.player) {
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  public pickCardFromDeck(): void {
    this.http.post<Player>(`${this.rpcEndpoint}/game/${this.gameId}/players/${this.playerId}/pick-card-from-deck`, {})
      .subscribe({
        next: player => {
          if (!this.player || !player) {
            return;
          }

          this.player.cards = GameComponent.sortCards(player.cards, this.player.cards);
          this.player.topCardInPile = player.topCardInPile;
          this.player.points = player.points;
          this.player.id = player.id;
          this.player.isPlayerTurn = player.isPlayerTurn;
          this.firstGroup = [];
          this.secondGroup = [];
        },
        error: error => this.handleError(error)
      });
  }

  public pickCardFromPile(): void {
    this.http.post<Player>(`${this.rpcEndpoint}/game/${this.gameId}/players/${this.playerId}/pick-card-from-pile`, {})
      .subscribe({
        next: player => {
          if (!this.player || !player) {
            return;
          }

          this.player.cards = GameComponent.sortCards(player.cards, this.player.cards);
          this.player.topCardInPile = player.topCardInPile;
          this.player.points = player.points;
          this.player.id = player.id;
          this.player.isPlayerTurn = player.isPlayerTurn;
          this.firstGroup = [];
          this.secondGroup = [];
        },
        error: error => this.handleError(error)
      });
  }

  public discardCard(): void {
    if (!this.player || !this.selectedCard) {
      return;
    }

    this.http.post<Player>(
      `${this.rpcEndpoint}/game/${this.gameId}/players/${this.playerId}/discard-card`,
      this.selectedCard
    ).subscribe({
      next: player => {
        if (!this.player || !player) {
          return;
        }

        this.player.cards = GameComponent.sortCards(player.cards, this.player.cards);
        this.player.topCardInPile = player.topCardInPile;
        this.player.points = player.points;
        this.player.id = player.id;
        this.player.isPlayerTurn = player.isPlayerTurn;
        this.firstGroup = [];
        this.secondGroup = [];
        this.selectedCard = null;
      },
      error: error => this.handleError(error)
    });
  }

  public cut(): void {
    if (!this.player) {
      return;
    }

    const cutDto: CutDto = {
      firstGroup: this.firstGroup,
      secondGroup: this.secondGroup,
      cardToCutWith: this.selectedCard
    };

    this.http.post<Player>(
      `${this.rpcEndpoint}/game/${this.gameId}/players/${this.playerId}/cut`,
      cutDto
    ).subscribe({
      next: player => {
        if (!this.player || !player.cards) {
          return;
        }


        this.player.cards = GameComponent.sortCards(player.cards, this.player.cards);
        this.player.topCardInPile = player.topCardInPile;
        this.player.points = player.points;
        this.player.id = player.id;
        this.player.isPlayerTurn = player.isPlayerTurn;
        this.firstGroup = [];
        this.secondGroup = [];
      },
      error: error => this.handleError(error)
    });
  }

  private handleError(httpError: HttpGenericErrorResponse<string>): void {
    this.snackbar.open(httpError.error, 'Close', { duration: 3000 })
  }

  private getAllCards(): Card[] {
    return [...this.player?.cards ?? [], ...this.firstGroup, ...this.secondGroup];
  }
}
