const missing = {
    value: 0,
    max: 1
}
const missingBlessures = {
    legeres: { list: [] },
    graves: { list: [] },
    critiques: { list: [] },
}

function defaultIfEmpty(node, def) {
    return node == undefined ? def : node
}

function ratio(node) {
    return betweenZeroAndOne(node.value / node.max)
}

const fraction = function (token) {
    const endurance = defaultIfEmpty(token.actor.data.data.sante.endurance, missing)
    const ratioEndurance = ratio(endurance)
    if (token.actor.data.data.blessures === undefined || token.actor.data.data.sante.vie === undefined) {
        return ratioEndurance
    }

    const nodeBlessures = defaultIfEmpty(token.actor.data.data.blessures, missingBlessures)
    const legeres = nodeBlessures.legeres.liste.filter(it => it.active).length
    const graves = nodeBlessures.graves.liste.filter(it => it.active).length
    const critiques = nodeBlessures.critiques.liste.filter(it => it.active).length > 0;

    /*
    * Estimation of seriousness of wounds: considerinng wounds that can be taken.
    * - 5x "legere" = light
    * - 2x "grave" = serious
    * - 1x "critique" = critical
    * If one type of wounds is full, next in this category automatically goes
    * to the next (ie: 3rd serious wound becomes critical).
    * Using an estimation of state of health based on the worst category of wounds
    */
    const tableBlessure = {
        legere: [0, 25, 45, 60, 70, 75],
        grave: [0, 80, 90],
        critique: [0, 99],
        inconscient: 100
    }
    const blessures = {
        value: (critiques > 0 ? tableBlessure.critique[critiques] :
            (graves > 0 ? tableBlessure.grave[graves] :
                tableBlessure.legere[legeres])),
        max: tableBlessure.inconscient
    }

    /*
    * Other values tat indicategood/bad health
    */
    const ratioFatigue = 1 - ratio(token.actor.data.data.sante.fatigue, missing)
    const ratioBlessure = 1 - ratio(blessures)
    const ratioVie = ratio(token.actor.data.data.sante.vie)

    return betweenZeroAndOne(Math.min(
        ratioFatigue,
        ratioEndurance,
        ratioVie,
        ratioBlessure)
    )
}

export { fraction }

function betweenZeroAndOne(ratio) {
    return Math.max(0, Math.min(ratio, 1))
}
