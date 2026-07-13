import { describe, expect, it } from 'vitest'
import { renderGraphSvg, type SvgGraph } from '../src/components/graph-svg'

const graph: SvgGraph = {
  bounds: { height: 220, width: 520, x: -20, y: -10 },
  nodes: [
    {
      dashArray: null,
      fill: '#f6f8fa',
      height: 68,
      id: 'owner/repo#1',
      label: '#1  Parse <owner> & "repository"',
      opacity: 1,
      stroke: '#1f883d',
      strokeWidth: 2,
      text: '#1f2328',
      width: 192,
      x: 100,
      y: 100,
    },
    {
      dashArray: '6 4',
      fill: '#ddf4ff',
      height: 68,
      id: 'owner/repo#2',
      label: '#2  Render dependency graph',
      opacity: 0.78,
      stroke: '#0969da',
      strokeWidth: 3,
      text: '#1f2328',
      width: 192,
      x: 400,
      y: 100,
    },
  ],
  edges: [
    {
      opacity: 0.62,
      source: 'owner/repo#1',
      stroke: '#8c959f',
      strokeWidth: 1.5,
      target: 'owner/repo#2',
    },
  ],
}

describe('graph SVG export', () => {
  it('renders a complete routed vector graph with safe text', () => {
    const svg = renderGraphSvg(graph, 'LR', 'light')

    expect(svg).toContain('viewBox="-20 -10 520 220"')
    expect(svg).toContain('M 196 100 H 250 V 100 H 304')
    expect(svg).toContain('marker-end="url(#arrow-0)"')
    expect(svg).toContain('2 issues and 1 dependency relationships.')
    expect(svg).toContain('Parse &lt;owner&gt; &amp; &quot;repository&quot;')
    expect(svg).not.toContain('Parse <owner>')
    expect(
      new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror'),
    ).toBeNull()
  })

  it('uses vertical routing and the active color mode', () => {
    const verticalGraph: SvgGraph = {
      ...graph,
      nodes: graph.nodes.map((node, index) => (index === 0 ? node : { ...node, x: 100, y: 300 })),
    }
    const svg = renderGraphSvg(verticalGraph, 'TB', 'dark')

    expect(svg).toContain('M 100 134 V 200 H 100 V 266')
    expect(svg).toContain('fill="#0d1117"')
  })

  it('caps the initial viewport without cropping the vector viewBox', () => {
    const svg = renderGraphSvg(
      { ...graph, bounds: { ...graph.bounds, width: 280_006 } },
      'LR',
      'light',
    )

    expect(svg).toContain('width="4096"')
    expect(svg).toContain('viewBox="-20 -10 280006 220"')
  })
})
