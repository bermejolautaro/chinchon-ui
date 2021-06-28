import { Component, Input, OnInit } from '@angular/core';

enum Suit {
  Swords,
  Clubs,
  Golds,
  Cups
}

enum SuitAtlas {
  Golds,
  Cups,
  Swords,
  Clubs
}

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {
  private _suit: Suit = 0;
  private _rank: number = 0;

  @Input() public set suit(value: Suit) {
    this._suit = value;

    const rowIndex = +CardComponent.suitToSuitAtlas(this._suit);
    this.positionX = -(this._rank * this.cardWidth);
    this.positionY = -(rowIndex * this.cardHeight);
  }

  @Input() public set rank(value: number) {
    this._rank = value;

    const rowIndex = +CardComponent.suitToSuitAtlas(this._suit);
    this.positionX = -(this._rank * this.cardWidth);
    this.positionY = -(rowIndex * this.cardHeight);

  }

  public readonly spriteWidth: number = 2496;
  public readonly spriteHeight: number = 1595;

  public readonly scale: number = .8;

  public readonly cardWidth: number = 208;
  public readonly cardHeight: number = 319;

  public positionX: number = 0;
  public positionY: number = 0;

  constructor() { }

  private static suitToSuitAtlas(suit: Suit): SuitAtlas {
    switch (suit) {
      case Suit.Swords: return SuitAtlas.Swords;
      case Suit.Clubs: return SuitAtlas.Clubs;
      case Suit.Golds: return SuitAtlas.Golds;
      case Suit.Cups: return SuitAtlas.Cups;
    }
  }

  public ngOnInit(): void {
    const rowIndex = +CardComponent.suitToSuitAtlas(this._suit);
    this.positionX = -(this._rank * this.cardWidth);
    this.positionY = -(rowIndex * this.cardHeight);
  }
}
