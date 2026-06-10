import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MINIMAL_PAIR_CLUSTERS, clusterFor, ALL_CLUSTER_KANA } from './minimalPairs'

describe('minimalPairs', () => {
  it('clusterFor повертає сусідів без самої кани', () => {
    assert.deepEqual(clusterFor('シ'), ['ツ'])
    assert.ok(clusterFor('ク').includes('タ'))
    assert.ok(!clusterFor('ク').includes('ク'))
  })

  it('кана поза кластерами — порожній список', () => {
    assert.deepEqual(clusterFor('ん'), [])
    assert.deepEqual(clusterFor(''), [])
  })

  it('кожна кана трапляється лише в одному кластері', () => {
    const seen = new Set<string>()
    for (const cluster of MINIMAL_PAIR_CLUSTERS) {
      for (const kana of cluster) {
        assert.ok(!seen.has(kana), `${kana} у двох кластерах`)
        seen.add(kana)
      }
    }
  })

  it('кластери мають щонайменше 2 кани', () => {
    for (const cluster of MINIMAL_PAIR_CLUSTERS) {
      assert.ok(cluster.length >= 2)
    }
  })

  it('ALL_CLUSTER_KANA покриває всі кластери', () => {
    const expected = MINIMAL_PAIR_CLUSTERS.flat()
    assert.equal(ALL_CLUSTER_KANA.length, expected.length)
    for (const kana of expected) assert.ok(ALL_CLUSTER_KANA.includes(kana))
  })
})
