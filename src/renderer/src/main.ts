const liste = document.querySelector<HTMLDListElement>('#versionen')

if (liste) {
  for (const [name, wert] of Object.entries(window.vela.versionen)) {
    const begriff = document.createElement('dt')
    begriff.textContent = name

    const beschreibung = document.createElement('dd')
    beschreibung.textContent = wert

    liste.append(begriff, beschreibung)
  }
}
