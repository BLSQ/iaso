
const recursive = require('recursive-readdir')
const path = require('path')
const fs = require('fs')

recursive(path.join(__dirname, '..', 'hat', 'assets', 'messages'), (err, list) => {
  if (err) {
    throw err
  }

  /*
   * Concat all lists of translation items,
   * turn them into
   * translationkey: defaultMessage
   * key-value-pairs
   */
  var items = Array.prototype.concat.apply([], list.map(function (path) {
    return require(path.split('.json')[0])
  })).reduce(function (all, item) {
    // Throw err on dupes
    if (all[item.id] && all[item.id] !== item.defaultMessage) {
      throw new Error('Found dupe: ' + item.id + ' ' + all[item.id] + ' ' + item.defaultMessage)
    }

    all[item.id] = item.defaultMessage
    return all
  }, {})

  fs.writeFileSync(
    path.join(__dirname, '/../', 'hat/assets/js/translations/en.json'),
    JSON.stringify(items, null, 2),
    { encoding: 'utf8', flag: 'w' }
  )
})
