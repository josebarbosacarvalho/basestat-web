import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class ActividadeService {
  items = [];

  constructor(private http: HttpClient) {}

  getActividades() {
    return this.http.get("/assets/actividades.json");
  }
}
