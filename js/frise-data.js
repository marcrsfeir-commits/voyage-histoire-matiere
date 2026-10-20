/* Content of the interactive frise: events, eras and icons (24×24 line icons). */
(function () {
  "use strict";

  const ICONS = {
    bang: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8"/>',
    microscope: '<path d="M5 21h14M9 21v-2.5h6V21"/><path d="M10.6 3.2l3.1 1.6-4.2 8.1-3.1-1.6z"/><path d="M8.5 12.6l-1.3 2.6"/><path d="M13.5 9.5a5 5 0 0 1 1.8 9"/>',
    cork: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.4h18M3 14.7h18M9 4v5.4M15 9.4v5.3M9 14.7V20M15 4v5.4"/>',
    microbe: '<ellipse cx="12" cy="12" rx="7.5" ry="4" transform="rotate(-30 12 12)"/><path d="M4.6 17.2c-.9.6-1.6 1.6-2.6 1.8M19.4 6.8c.9-.6 1.6-1.6 2.6-1.8M7 9.6c-.6-1-1.6-1.4-2.4-1.2M17 14.4c.6 1 1.6 1.4 2.4 1.2"/><circle cx="10.3" cy="12.8" r="1"/><circle cx="13.8" cy="11" r="1"/>',
    sphere: '<circle cx="12" cy="12" r="7.5"/><path d="M8.3 9.6a4.3 4.3 0 0 1 3.2-2.4"/>',
    cell: '<circle cx="12" cy="12" r="8.5"/><circle cx="13.2" cy="10.8" r="3"/><circle cx="7.6" cy="14.8" r=".9"/><circle cx="15.8" cy="16.2" r=".9"/>',
    division: '<circle cx="8" cy="12" r="5.6"/><circle cx="16" cy="12" r="5.6"/><circle cx="8" cy="12" r="1.8"/><circle cx="16" cy="12" r="1.8"/>',
    table: '<rect x="3" y="4.5" width="4" height="4" rx=".6"/><rect x="17" y="4.5" width="4" height="4" rx=".6"/><rect x="3" y="10" width="4" height="4" rx=".6"/><rect x="7.7" y="10" width="4" height="4" rx=".6"/><rect x="12.3" y="10" width="4" height="4" rx=".6"/><rect x="17" y="10" width="4" height="4" rx=".6"/><rect x="3" y="15.5" width="4" height="4" rx=".6"/><rect x="7.7" y="15.5" width="4" height="4" rx=".6"/><rect x="12.3" y="15.5" width="4" height="4" rx=".6"/><rect x="17" y="15.5" width="4" height="4" rx=".6"/>',
    radiation: '<circle cx="12" cy="12" r="1.9"/><path d="M10.7 9.8 7.6 4.5A8.6 8.6 0 0 0 3.4 12h6.1M13.3 9.8l3.1-5.3a8.6 8.6 0 0 1 4.2 7.5h-6.1M10.7 14.2l-3.1 5.3a8.6 8.6 0 0 0 8.8 0l-3.1-5.3"/>',
    atom: '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>',
    expansion: '<circle cx="12" cy="12" r="2.2"/><path d="M12 7.5V3m0 0-2 2m2-2 2 2M12 16.5V21m0 0-2-2m2 2 2-2M7.5 12H3m0 0 2-2m-2 2 2 2M16.5 12H21m0 0-2-2m2 2-2 2"/>',
    beam: '<rect x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M12 6v12"/><rect x="6.5" y="8" width="11" height="2.6" rx="1.2"/><rect x="6.5" y="12.8" width="11" height="2.6" rx="1.2"/><path d="M5 21h14M8 18h8"/>',
    antenna: '<path d="M12 21v-7.5M8 21h8"/><circle cx="12" cy="11.5" r="1.6"/><path d="M8.6 8a4.8 4.8 0 0 1 6.8 0M6.2 5.6a8.2 8.2 0 0 1 11.6 0"/>',
    tip: '<path d="M9.3 2.5h5.4l-2.2 8.5h-1z"/><path d="M12 12.6v2" stroke-dasharray="1 1.6"/><circle cx="5.5" cy="18.5" r="2.6"/><circle cx="12" cy="18.5" r="2.6"/><circle cx="18.5" cy="18.5" r="2.6"/>',
    crystal: '<path d="M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3z"/><path d="M12 3v18M4.5 7.3l15 9.4M19.5 7.3l-15 9.4" opacity=".45"/>',
    printer: '<path d="M9 3h6v5l-2 3h-2L9 8z"/><path d="M12 11v1.5"/><path d="M5 21h14M6.5 18h11M8 15h8"/>',
  };

  const ORIGIN = {
    id: "big-bang-origin", year: null, label: "−13,8 Ga", kind: "origin", disc: "PC", icon: "bang",
    title: "Le Big Bang", who: "Naissance de l'Univers et de la matière",
    desc: "Tout commence : l'Univers observable est minuscule, extrêmement chaud et dense. En grandissant et en se refroidissant, il fabrique les premiers noyaux d'hydrogène et d'hélium.",
    href: "#big-bang",
  };

  const EVENTS = [
    { year: 1590, label: "vers 1590", kind: "tech", disc: "SVT", icon: "microscope", title: "Le microscope composé", who: "Attribué à Hans et Zacharias Janssen",
      desc: "Deux lentilles alignées dans un tube grossissent bien plus qu'une simple loupe. L'inventeur exact reste discuté par les historiens.", href: "#hooke" },
    { year: 1665, kind: "sci", disc: "SVT", icon: "cork", title: "Hooke nomme la « cellule »", who: "Robert Hooke",
      desc: "En observant une fine tranche de liège, Hooke voit des milliers de petites cases et les appelle « cellules ». Il publie ses dessins dans Micrographia.", href: "#hooke", img: "img/hooke-cork.jpg", imgAlt: "Gravure du liège vu au microscope par Hooke" },
    { year: 1674, kind: "sci", disc: "SVT", icon: "microbe", title: "Les « animalcules »", who: "Antoni van Leeuwenhoek",
      desc: "Avec une seule lentille parfaitement polie, il découvre dans une goutte d'eau des êtres vivants invisibles à l'œil nu : les micro-organismes.", href: "#hooke", img: "img/leeuwenhoek.jpg", imgAlt: "Portrait d'Antoni van Leeuwenhoek" },
    { year: 1803, kind: "sci", disc: "PC", icon: "sphere", title: "La théorie atomique", who: "John Dalton",
      desc: "La matière est faite d'atomes. Chaque élément chimique a ses propres atomes, tous identiques, avec une masse bien précise." },
    { year: 1838, label: "1838-39", kind: "sci", disc: "SVT", icon: "cell", title: "La théorie cellulaire", who: "Matthias Schleiden et Theodor Schwann",
      desc: "D'abord chez les plantes, puis chez les animaux : tous les êtres vivants sont faits de cellules.", href: "#cellule", img: "img/schwann.jpg", imgAlt: "Portrait de Theodor Schwann" },
    { year: 1855, kind: "sci", disc: "SVT", icon: "division", title: "Toute cellule vient d'une cellule", who: "Rudolf Virchow",
      desc: "« Omnis cellula e cellula » : une cellule ne naît jamais de rien, mais toujours de la division d'une autre cellule.", href: "#cellule", img: "img/virchow.jpg", imgAlt: "Portrait de Rudolf Virchow" },
    { year: 1869, kind: "sci", disc: "PC", icon: "table", title: "Le tableau périodique", who: "Dmitri Mendeleïev",
      desc: "Il range les éléments chimiques selon leur masse et leurs propriétés, et laisse des cases vides pour des éléments encore inconnus… qu'on découvrira ensuite." },
    { year: 1897, label: "1896-98", kind: "sci", disc: "PC", icon: "radiation", title: "La radioactivité", who: "Henri Becquerel, Marie et Pierre Curie",
      desc: "Becquerel découvre que l'uranium émet un rayonnement invisible. Marie et Pierre Curie trouvent ensuite deux nouveaux éléments : le polonium et le radium.", href: "#radioactivite", img: "img/curie.jpg", imgAlt: "Portrait de Marie Curie" },
    { year: 1911, kind: "sci", disc: "PC", icon: "atom", title: "Le noyau de l'atome", who: "Ernest Rutherford",
      desc: "En bombardant une feuille d'or de particules α, il montre que l'atome est presque vide, avec un noyau minuscule en son centre.", href: "#atome", img: "img/rutherford.jpg", imgAlt: "Portrait d'Ernest Rutherford" },
    { year: 1927, kind: "sci", disc: "PC", icon: "expansion", title: "L'Univers est en expansion", who: "Georges Lemaître",
      desc: "Les galaxies s'éloignent les unes des autres. Lemaître en déduit que l'Univers a commencé très petit et très chaud : l'idée du Big Bang.", href: "#big-bang", img: "img/lemaitre.jpg", imgAlt: "Portrait de Georges Lemaître" },
    { year: 1931, kind: "tech", disc: "SVT", icon: "beam", title: "Le microscope électronique", who: "Ernst Ruska et Max Knoll",
      desc: "Des électrons à la place de la lumière : on dépasse la limite des microscopes optiques et on peut enfin voir les virus et l'intérieur des cellules.", href: "#voir-atomes", img: "img/ruska-microscope.jpg", imgAlt: "Microscope électronique d'Ernst Ruska" },
    { year: 1965, kind: "sci", disc: "PC", icon: "antenna", title: "La lumière fossile du Big Bang", who: "Arno Penzias et Robert Wilson",
      desc: "Une antenne capte un faible signal venu de tout le ciel : c'est la plus vieille lumière de l'Univers, une preuve forte du Big Bang.", href: "#big-bang", img: "img/wmap.jpg", imgAlt: "Carte du fond diffus cosmologique" },
    { year: 1981, kind: "tech", disc: "PC", icon: "tip", title: "Le microscope à effet tunnel", who: "Gerd Binnig et Heinrich Rohrer",
      desc: "Une pointe ultra-fine suit la surface atome par atome grâce à l'effet tunnel. Pour la première fois, on « voit » les atomes.", href: "#voir-atomes" },
    { year: 2017, kind: "sci", disc: "PC", icon: "crystal", title: "Des cristaux en apesanteur", who: "Thomas Pesquet (ISS)",
      desc: "Dans l'ISS, les cristaux d'un médicament contre le cancer poussent plus réguliers qu'au sol, sans sédimentation ni convection.", href: "#espace", img: "img/pesquet.jpg", imgAlt: "Portrait de Thomas Pesquet" },
    { year: 2023, kind: "tech", disc: "SVT", icon: "printer", title: "Bio-impression 3D dans l'espace", who: "Sultan Al Neyadi (ISS)",
      desc: "Une imprimante 3D dépose des cellules vivantes couche par couche. En apesanteur, un ménisque humain est imprimé pour la première fois.", href: "#espace", img: "img/alneyadi.jpg", imgAlt: "Portrait de Sultan Al Neyadi" },
  ];

  const ERAS = [
    { from: 1580, to: 1700, label: "XVIIᵉ siècle · premiers microscopes", short: "XVIIᵉ siècle" },
    { from: 1795, to: 1875, label: "XIXᵉ siècle · la cellule et l'atome", short: "XIXᵉ siècle" },
    { from: 1890, to: 1940, label: "Le noyau et l'Univers", short: "Noyau, Univers" },
    { from: 1958, to: 2025, label: "Voir les atomes, aller dans l'espace", short: "Atomes, espace" },
  ];

  const KINDS = { tech: "Innovation technique", sci: "Découverte scientifique", origin: "Origine de la matière" };
  const DISCIPLINES = { SVT: "SVT", PC: "Physique-Chimie" };

  window.VM.frise = { ICONS, ORIGIN, EVENTS, ERAS, KINDS, DISCIPLINES };
})();
