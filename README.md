# Voyage dans l'histoire de la matière

Site interactif qui accompagne la frise chronologique du projet interdisciplinaire de Seconde (SVT, Physique-Chimie, NSI, Arts). Un QR code collé sur la frise ouvre ce site.

**Site en ligne :** https://marcrsfeir-commits.github.io/voyage-histoire-matiere/

## Contenu

Sept chapitres, chacun avec une explication, une expérience historique, une simulation interactive, des vidéos et des sources :

1. Hooke et Leeuwenhoek : les premiers microscopes (1665)
2. La théorie cellulaire (1838-1855)
3. La radioactivité et Marie Curie (1896-1898)
4. Rutherford et le noyau de l'atome (1911)
5. Lemaître et le Big Bang (1927)
6. Microscopes électronique et à effet tunnel (1931-1981)
7. La matière en apesanteur : Thomas Pesquet (2017) et Sultan Al Neyadi (2023)

Plus une frise de navigation à l'échelle, un explorateur d'échelles (de la fourmi à l'atome) et un quiz.

## Technique

HTML, CSS et JavaScript, sans framework. Les animations sont dessinées dans des `canvas` (`js/sims-life.js`, `js/sims-matter.js`). Pour tester en local :

```bash
python3 -m http.server 8000
```

Images : Wikimedia Commons (domaine public ou licences libres, crédits en bas de page).
