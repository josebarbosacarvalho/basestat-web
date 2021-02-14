import { HttpClient } from "@angular/common/http";
import { Component, ViewChild, AfterViewInit, OnInit } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { merge, Observable, of as observableOf } from "rxjs";
import { catchError, map, startWith, switchMap } from "rxjs/operators";
import pt from "@angular/common/locales/pt";
import { registerLocaleData } from "@angular/common";

@Component({
  selector: "app-actividade",
  templateUrl: "./actividade.html",
  styleUrls: ["./actividade.css"]
})
export class Actividade implements AfterViewInit, OnInit {
  displayedColumns: string[] = ["activity", "amount", "percentage"];
  exampleDatabase: ExampleHttpDatabase | null;
  data: activityItem[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _httpClient: HttpClient) {}

  ngOnInit() {
    registerLocaleData(pt);
  }

  ngAfterViewInit() {
    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.exampleDatabase!.getRepoData(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex
          );
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.total_count;

          return data.items;
        }),
        catchError(error => {
          this.isLoadingResults = false;
          // Catch if the GitHub API has reached its rate limit. Return empty data.
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      )
      .subscribe(data => (this.data = data));
  }
}

export interface ActivitiesRankApi {
  items: activityItem[];
  total_count: number;
}

export interface activityItem {
  activity: string;
  amount: number;
  percentage: number;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleHttpDatabase {
  constructor(private _httpClient: HttpClient) {}

  getRepoData(
    sort: string,
    order: string,
    page: number
  ): Observable<ActivitiesRankApi> {
    const href =
      "https://f2o3rbv3zd.execute-api.eu-west-1.amazonaws.com/prd/getactivitiesrank";
    const requestUrl = `${href}?page=${page}`;

    return this._httpClient.get<ActivitiesRankApi>(requestUrl);
  }
}
