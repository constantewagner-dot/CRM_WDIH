// db.js — Camada de persistência central do CRM WDIH (localStorage)
const DB = {
  KEY: 'wdih_db',

  data: {
    programas: ['Smiles', 'LATAM', 'TudoAzul', 'Livelo'],
  },

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) {
      try { this.data = JSON.parse(raw); } catch (e) { this.data = { programas: [] }; }
    }
    if (!Array.isArray(this.data.programas)) {
      this.data.programas = ['Smiles', 'LATAM', 'TudoAzul', 'Livelo'];
    }
  },

  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  },

  init() {
    this.load();
  },

  getProgramas() {
    return this.data.programas || [];
  },

  setProgramas(lista) {
    this.data.programas = lista;
    this.save();
  },

  resetAll() {
    localStorage.clear();
  }
};

document.addEventListener('DOMContentLoaded', () => DB.init());
