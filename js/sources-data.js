/* Where every piece of information on the site comes from (links checked on 15/11/2026).
   frise: by event year (js/frise-data.js) · universe: by stage, in order (js/universe-data.js) ·
   general: hero and scale explorer. Shown in the frise sheets, the 3D model card and the footer. */
(function () {
  "use strict";
  window.VM = window.VM || {};

  const wiki = (title, page) => [`Wikipédia · ${title}`, `https://fr.wikipedia.org/wiki/${page}`];
  const nobel = (label, path) => [`Fondation Nobel · ${label}`, `https://www.nobelprize.org/prizes/${path}`];
  const S = {
    bigBang: wiki("Big Bang", "Big_Bang"),
    hoyle: wiki("Fred Hoyle", "Fred_Hoyle"),
    nasaBigBang: ["NASA (WMAP) · Les preuves du Big Bang", "https://map.gsfc.nasa.gov/universe/bb_theory.html"],
    lemaitre: wiki("Georges Lemaître", "Georges_Lema%C3%AEtre"),
    hubbleLaw: wiki("Loi de Hubble-Lemaître", "Loi_de_Hubble-Lema%C3%AEtre"),
    cmb: wiki("Fond diffus cosmologique", "Fond_diffus_cosmologique"),
    nobel1978: nobel("prix Nobel de physique 1978 (Penzias et Wilson)", "physics/1978/summary/"),
    nobel1986: nobel("prix Nobel de physique 1986 (Ruska, Binnig, Rohrer)", "physics/1986/summary/"),
    nobel1903: nobel("prix Nobel de physique 1903 (Becquerel, P. et M. Curie)", "physics/1903/summary/"),
    cellTheory: wiki("Théorie cellulaire", "Th%C3%A9orie_cellulaire"),
    chrono: wiki("Chronologie de l'Univers", "Chronologie_de_l%27Univers"),
    starNucleo: wiki("Nucléosynthèse stellaire", "Nucl%C3%A9osynth%C3%A8se_stellaire"),
    planck: ["ESA · Planck, un Univers presque parfait (âge, 4,9 % de matière ordinaire)", "https://www.esa.int/Science_Exploration/Space_Science/Planck/Planck_reveals_an_almost_perfect_Universe"],
    opticalMicroscope: wiki("Microscope optique", "Microscope_optique"),
    electronMicroscope: wiki("Microscope électronique", "Microscope_%C3%A9lectronique"),
    stm: wiki("Microscope à effet tunnel", "Microscope_%C3%A0_effet_tunnel"),
    milkyWay: wiki("Voie lactée", "Voie_lact%C3%A9e"),
  };

  const frise = {
    "-13800000000": [S.bigBang, S.hoyle, S.nasaBigBang],
    "-400": [wiki("Démocrite", "D%C3%A9mocrite"), wiki("Atomisme", "Atomisme")],
    1590: [wiki("Zacharias Janssen", "Zacharias_Janssen"), S.opticalMicroscope],
    1665: [wiki("Robert Hooke", "Robert_Hooke"), ["R. Hooke, Micrographia (1665), texte intégral · Projet Gutenberg", "https://www.gutenberg.org/ebooks/15491"]],
    1674: [wiki("Antoni van Leeuwenhoek", "Antoni_van_Leeuwenhoek"), ["N. Lane, « The unseen world », Phil. Trans. R. Soc. B (2015)", "https://doi.org/10.1098/rstb.2014.0344"]],
    1789: [wiki("Antoine Lavoisier", "Antoine_Lavoisier"), wiki("Loi de conservation de la masse", "Loi_de_conservation_de_la_masse")],
    1803: [wiki("John Dalton", "John_Dalton"), wiki("Daltonisme", "Daltonisme")],
    1831: [wiki("Robert Brown", "Robert_Brown_(botaniste)"), wiki("Noyau (biologie)", "Noyau_(biologie)"), wiki("Mouvement brownien", "Mouvement_brownien")],
    1838: [S.cellTheory, wiki("Matthias Schleiden", "Matthias_Jakob_Schleiden"), wiki("Theodor Schwann", "Theodor_Schwann")],
    1855: [wiki("Rudolf Virchow", "Rudolf_Virchow"), S.cellTheory],
    1869: [wiki("Dmitri Mendeleïev", "Dmitri_Mendele%C3%AFev"), wiki("Tableau périodique", "Tableau_p%C3%A9riodique_des_%C3%A9l%C3%A9ments"), wiki("Mendélévium", "Mend%C3%A9l%C3%A9vium")],
    1896: [wiki("Henri Becquerel", "Henri_Becquerel"), wiki("Becquerel (unité)", "Becquerel"), S.nobel1903],
    1897: [wiki("Joseph John Thomson", "Joseph_John_Thomson"), wiki("Modèle atomique de Thomson", "Mod%C3%A8le_atomique_de_Thomson"), nobel("J. J. Thomson, prix Nobel de physique 1906", "physics/1906/thomson/facts/")],
    1898: [wiki("Marie Curie", "Marie_Curie"), wiki("Pierre Curie", "Pierre_Curie"), S.nobel1903, nobel("prix Nobel de chimie 1911 (M. Curie)", "chemistry/1911/summary/")],
    1911: [wiki("Expérience de Rutherford", "Exp%C3%A9rience_de_Rutherford"), nobel("E. Rutherford, prix Nobel de chimie 1908", "chemistry/1908/rutherford/facts/")],
    1927: [S.lemaitre, S.hubbleLaw],
    1929: [wiki("Edwin Hubble", "Edwin_Hubble"), S.hubbleLaw, wiki("Télescope spatial Hubble", "T%C3%A9lescope_spatial_Hubble")],
    1931: [wiki("Ernst Ruska", "Ernst_Ruska"), S.electronMicroscope, S.nobel1986],
    1953: [wiki("Rosalind Franklin", "Rosalind_Franklin"), wiki("Photo 51", "Photo_51"), nobel("prix Nobel de médecine 1962", "medicine/1962/summary/")],
    1965: [S.cmb, S.nobel1978],
    1981: [S.stm, S.nobel1986, ["D. M. Eigler et E. K. Schweizer, Nature 344 (1990) : « IBM » en 35 atomes", "https://doi.org/10.1038/344524a0"]],
    2017: [wiki("Thomas Pesquet", "Thomas_Pesquet"), ["ISS National Laboratory · résultats de Merck sur le pembrolizumab", "https://www.issnationallab.org/merck-lab-publishes-pembrolizumab-results/"], ["P. Reichert et al., npj Microgravity (2019)", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6889310/"]],
    2023: [wiki("Sultan Al Neyadi", "Sultan_Al_Neyadi"), ["Redwire · premier ménisque humain bio-imprimé sur l'ISS (2023)", "https://ir.rdw.com/news-events/press-releases/detail/103/redwire-bioprinter-wins-a-popular-science-2023-best-of"]],
  };

  const universe = [
    [S.bigBang, S.hoyle, S.nasaBigBang],
    [wiki("Inflation cosmique", "Inflation_cosmique"), S.chrono],
    [S.chrono, wiki("Quark", "Quark"), wiki("Proton", "Proton")],
    [wiki("Nucléosynthèse primordiale", "Nucl%C3%A9osynth%C3%A8se_primordiale"), S.nasaBigBang],
    [wiki("Recombinaison (cosmologie)", "Recombinaison_(cosmologie)"), S.cmb, S.nobel1978],
    [wiki("Âges sombres", "%C3%82ges_sombres_(cosmologie)"), wiki("Matière noire", "Mati%C3%A8re_noire")],
    [wiki("Étoile de population III", "%C3%89toile_de_population_III"), S.starNucleo, wiki("Supernova", "Supernova")],
    [wiki("Galaxie", "Galaxie"), S.milkyWay],
    [wiki("Formation et évolution du Système solaire", "Formation_et_%C3%A9volution_du_Syst%C3%A8me_solaire"), S.starNucleo],
    [wiki("Énergie noire", "%C3%89nergie_noire"), ["NASA · L'énergie noire", "https://science.nasa.gov/dark-energy/"], S.planck],
  ];

  const general = [
    ["Zoom du héros et curseur « Changer d'échelle »", [wiki("Ordres de grandeur de longueur", "Ordres_de_grandeur_de_longueur"), S.milkyWay, S.opticalMicroscope, S.electronMicroscope, S.stm]],
    ["Âge de l'Univers et vue d'ensemble", [S.planck, S.chrono]],
  ];

  window.VM.sources = { frise, universe, general };
})();
