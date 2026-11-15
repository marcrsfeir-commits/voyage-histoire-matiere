/* The 10 stages of the history of the Universe shown by the 3D model (js/universe3d.js).
   u = position along the model's time axis (0 = Big Bang, 40 = today), span = region lit when
   the stage is selected, view = camera distance / angles when the stage is selected. */
(function () {
  "use strict";
  window.VM = window.VM || {};

  window.VM.universe = [
    {
      name: "Le Big Bang", time: "t = 0", age: "0", temp: "Inimaginable",
      u: 0, span: [0, 0.5], view: { r: 4.5, az: -0.9, el: 0.2 },
      text: [
        "Il y a 13,8 milliards d'années, tout l'Univers que l'on peut observer aujourd'hui est rassemblé dans un état extrêmement chaud et dense.",
        "Ce n'est pas une explosion dans l'espace : c'est l'espace lui-même qui commence à s'étirer. Aux tout premiers instants, nos lois de la physique ne suffisent plus à décrire ce qui se passe.",
      ],
      forms: ["Espace", "Temps", "Énergie"],
      fact: "Le nom « Big Bang » a été inventé en 1949 par l'astronome Fred Hoyle… pour se moquer de la théorie de Lemaître !",
    },
    {
      name: "L'inflation", time: "10⁻³⁶ à 10⁻³² seconde", age: "une fraction de seconde", temp: "Inimaginable",
      u: 0.7, span: [0, 1.6], view: { r: 6.5, az: -0.75, el: 0.25 },
      text: [
        "Selon la théorie de l'inflation, l'Univers grandit d'un coup, d'un facteur au moins 10²⁶ (un 1 suivi de 26 zéros), en une fraction de seconde.",
        "De minuscules irrégularités de densité sont alors étirées à très grande échelle : ce sont les « graines » des futures galaxies.",
      ],
      forms: ["Expansion", "Graines des galaxies"],
      fact: "C'est comme si une bille devenait, en un clin d'œil, plus grande que la Voie lactée.",
    },
    {
      name: "La soupe de particules", time: "10⁻¹² s à 1 seconde", age: "moins d'une seconde", temp: "≈ 2 000 milliards de °C",
      u: 2.5, span: [1.3, 3.7], view: { r: 9, az: -0.6, el: 0.25 },
      text: [
        "L'Univers est une « soupe » brûlante de quarks, d'électrons, de neutrinos et de lumière. Les particules s'agitent et se heurtent sans cesse.",
        "Vers un millionième de seconde, en refroidissant, les quarks s'assemblent par trois : les premiers protons et neutrons apparaissent.",
      ],
      forms: ["Quarks", "Électrons", "Protons", "Neutrons"],
      fact: "Un proton est fait de trois quarks : deux quarks « up » et un quark « down ».",
    },
    {
      name: "Les premiers noyaux", time: "3 à 20 minutes", age: "3 à 20 minutes", temp: "≈ 1 milliard de °C",
      u: 4.8, span: [3.5, 6.3], view: { r: 10, az: -0.55, el: 0.25 },
      text: [
        "Protons et neutrons fusionnent pour former les premiers noyaux : surtout de l'hélium, un peu de deutérium et des traces de lithium.",
        "Au bout d'environ 20 minutes, l'Univers est devenu trop froid et trop dilué : la fabrication s'arrête. Bilan : environ 75 % d'hydrogène et 25 % d'hélium (en masse).",
      ],
      forms: ["Noyaux d'hydrogène", "Hélium", "Deutérium", "Lithium"],
      fact: "On retrouve ces proportions dans les étoiles les plus anciennes : c'est l'une des preuves du Big Bang.",
    },
    {
      name: "Les premiers atomes", time: "380 000 ans", age: "380 000 ans", temp: "≈ 2 700 °C (3 000 K)",
      u: 7, span: [6.5, 7.6], view: { r: 10, az: -1.15, el: 0.18 },
      text: [
        "L'Univers est assez froid pour que les électrons s'accrochent aux noyaux : les premiers atomes d'hydrogène et d'hélium se forment.",
        "La lumière peut enfin voyager librement : l'Univers devient transparent. Cette lumière, la plus ancienne que l'on puisse observer, nous arrive encore : c'est le fond diffus cosmologique (le disque coloré du modèle).",
      ],
      forms: ["Atomes d'hydrogène", "Atomes d'hélium", "Lumière fossile"],
      fact: "Penzias et Wilson l'ont captée par hasard en 1965. Refroidie par l'expansion, elle est aujourd'hui à −270 °C.",
    },
    {
      name: "Les âges sombres", time: "380 000 ans → 100 millions d'années", age: "jusqu'à 100 millions d'années", temp: "de 2 700 °C à −200 °C",
      u: 10.5, span: [7.5, 13.8], view: { r: 13, az: -0.5, el: 0.3 },
      text: [
        "Aucune étoile ne brille encore : l'Univers est plongé dans le noir. Il ne contient que du gaz d'hydrogène et d'hélium, et de la matière noire, invisible.",
        "Attiré par la gravité, le gaz se rassemble lentement en immenses filaments et en nœuds : la « toile cosmique ».",
      ],
      forms: ["Toile cosmique", "Nuages de gaz", "Matière noire"],
      fact: "La matière noire est environ 5 fois plus abondante que la matière ordinaire, mais personne ne sait encore de quoi elle est faite.",
    },
    {
      name: "Les premières étoiles", time: "≈ 100 à 200 millions d'années", age: "≈ 150 millions d'années", temp: "≈ −215 °C",
      u: 16, span: [13.5, 19.5], view: { r: 14, az: -0.4, el: 0.3 },
      text: [
        "Dans les nuages de gaz les plus denses, la gravité comprime et chauffe le gaz jusqu'à allumer la fusion nucléaire : les premières étoiles s'allument.",
        "Énormes, elles fabriquent dans leur cœur du carbone, de l'oxygène, du fer… puis explosent en supernovas et dispersent ces nouveaux éléments dans l'espace.",
      ],
      forms: ["Étoiles", "Carbone", "Oxygène", "Fer", "Supernovas"],
      fact: "Le carbone de vos cellules et le fer de votre sang ont été fabriqués au cœur d'étoiles.",
    },
    {
      name: "Les galaxies", time: "≈ 1 milliard d'années", age: "≈ 1 milliard d'années", temp: "≈ −255 °C",
      u: 22, span: [19, 28], view: { r: 12, az: -0.45, el: 0.3 },
      text: [
        "Les étoiles se regroupent par milliards dans des galaxies, qui se rencontrent, fusionnent et grandissent le long des filaments de la toile cosmique.",
        "Notre galaxie, la Voie lactée, commence à se former il y a plus de 13 milliards d'années. Elle contient aujourd'hui plus de 100 milliards d'étoiles.",
      ],
      forms: ["Galaxies", "Amas de galaxies", "Voie lactée"],
      fact: "On estime qu'il existe au moins 100 milliards de galaxies dans l'Univers observable.",
    },
    {
      name: "Le Système solaire", time: "il y a 4,6 milliards d'années", age: "9,2 milliards d'années", temp: "≈ −269 °C",
      u: 30, span: [28.5, 31.5], view: { r: 3.4, az: -0.5, el: 0.45 }, solar: true,
      text: [
        "Dans un bras de la Voie lactée, un nuage de gaz et de poussières, enrichi par des générations d'étoiles mortes, s'effondre sur lui-même.",
        "Le Soleil s'allume au centre, et les planètes se forment dans le disque de matière qui tourne autour de lui, dont la Terre (zoom au centre du modèle).",
      ],
      forms: ["Soleil", "Planètes", "Terre", "Eau"],
      fact: "Nous sommes faits de poussières d'étoiles : à part l'hydrogène, né du Big Bang, presque tous les atomes de notre corps viennent d'étoiles.",
    },
    {
      name: "Aujourd'hui", time: "13,8 milliards d'années", age: "13,8 milliards d'années", temp: "−270 °C (2,7 K)",
      u: 38.5, span: [32, 41], view: { r: 15, az: -0.3, el: 0.3 },
      text: [
        "L'Univers continue de grandir, et son expansion accélère depuis environ 5 milliards d'années, sous l'effet d'une mystérieuse « énergie noire » (la forme évasée du modèle).",
        "La matière ordinaire, celle des atomes, des étoiles et de notre corps, ne représente qu'environ 5 % du contenu de l'Univers.",
      ],
      forms: ["Énergie noire", "Expansion accélérée", "Nous"],
      fact: "La lumière des galaxies les plus lointaines a voyagé plus de 13 milliards d'années pour arriver jusqu'à nos télescopes.",
    },
  ];
})();
