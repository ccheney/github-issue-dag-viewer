import type { Core } from 'cytoscape'
import type { ColorMode } from '../hooks/use-color-mode'
import type { LayoutDirection } from './graph-renderer'

const SVG_PADDING = 48
const MAX_INTRINSIC_DIMENSION = 4096
const MAX_LABEL_LINES = 4
const LABEL_LINE_LENGTH = 28

interface SvgBounds {
  height: number
  width: number
  x: number
  y: number
}

interface SvgNode {
  dashArray: string | null
  fill: string
  height: number
  id: string
  label: string
  opacity: number
  stroke: string
  strokeWidth: number
  text: string
  width: number
  x: number
  y: number
}

interface SvgEdge {
  opacity: number
  source: string
  stroke: string
  strokeWidth: number
  target: string
}

export interface SvgGraph {
  bounds: SvgBounds
  edges: readonly SvgEdge[]
  nodes: readonly SvgNode[]
}

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const number = (value: number): string => Number(value.toFixed(2)).toString()

const styleNumber = (value: unknown, fallback: number): number => {
  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : fallback
}

const labelLines = (label: string): string[] => {
  const words = label.trim().split(/\s+/u)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`
    if (candidate.length <= LABEL_LINE_LENGTH) {
      current = candidate
      continue
    }
    if (current.length > 0) lines.push(current)

    let remaining = word
    while (remaining.length > LABEL_LINE_LENGTH) {
      lines.push(remaining.slice(0, LABEL_LINE_LENGTH))
      remaining = remaining.slice(LABEL_LINE_LENGTH)
    }
    current = remaining
  }
  if (current.length > 0) lines.push(current)
  if (lines.length <= MAX_LABEL_LINES) return lines

  const visible = lines.slice(0, MAX_LABEL_LINES)
  const finalLine = visible.at(-1) ?? ''
  visible[MAX_LABEL_LINES - 1] = `${finalLine.slice(0, LABEL_LINE_LENGTH - 1).trimEnd()}…`
  return visible
}

const edgePath = (source: SvgNode, target: SvgNode, direction: LayoutDirection): string => {
  if (direction === 'LR') {
    const forward = target.x >= source.x
    const startX = source.x + (forward ? source.width / 2 : -source.width / 2)
    const endX = target.x + (forward ? -target.width / 2 : target.width / 2)
    const middleX = (startX + endX) / 2
    return `M ${number(startX)} ${number(source.y)} H ${number(middleX)} V ${number(target.y)} H ${number(endX)}`
  }

  const forward = target.y >= source.y
  const startY = source.y + (forward ? source.height / 2 : -source.height / 2)
  const endY = target.y + (forward ? -target.height / 2 : target.height / 2)
  const middleY = (startY + endY) / 2
  return `M ${number(source.x)} ${number(startY)} V ${number(middleY)} H ${number(target.x)} V ${number(endY)}`
}

const renderNode = (node: SvgNode): string => {
  const lines = labelLines(node.label)
  const lineHeight = 13
  const firstBaseline = node.y - ((lines.length - 1) * lineHeight) / 2 + 4
  const dash = node.dashArray === null ? '' : ` stroke-dasharray="${node.dashArray}"`
  const text = lines
    .map(
      (line, index) =>
        `<tspan x="${number(node.x)}" y="${number(firstBaseline + index * lineHeight)}">${escapeXml(line)}</tspan>`,
    )
    .join('')

  return `<g data-node-id="${escapeXml(node.id)}" opacity="${number(node.opacity)}"><title>${escapeXml(node.label)}</title><rect x="${number(node.x - node.width / 2)}" y="${number(node.y - node.height / 2)}" width="${number(node.width)}" height="${number(node.height)}" rx="8" fill="${escapeXml(node.fill)}" stroke="${escapeXml(node.stroke)}" stroke-width="${number(node.strokeWidth)}"${dash}/><text fill="${escapeXml(node.text)}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="11" text-anchor="middle">${text}</text></g>`
}

const intrinsicSize = (bounds: SvgBounds): { height: number; width: number } => {
  const scale = Math.min(1, MAX_INTRINSIC_DIMENSION / Math.max(bounds.width, bounds.height))
  return {
    height: Math.max(1, Math.round(bounds.height * scale)),
    width: Math.max(1, Math.round(bounds.width * scale)),
  }
}

export const renderGraphSvg = (
  graph: SvgGraph,
  direction: LayoutDirection,
  colorMode: ColorMode,
): string => {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]))
  const markerByStroke = new Map(
    [...new Set(graph.edges.map((edge) => edge.stroke))].map((stroke, index) => [
      stroke,
      `arrow-${index}`,
    ]),
  )
  const markers = [...markerByStroke]
    .map(
      ([stroke, id]) =>
        `<marker id="${id}" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 8 4 L 0 8 z" fill="${escapeXml(stroke)}"/></marker>`,
    )
    .join('')
  const edges = graph.edges
    .map((edge) => {
      const source = nodesById.get(edge.source)
      const target = nodesById.get(edge.target)
      const marker = markerByStroke.get(edge.stroke)
      if (source === undefined || target === undefined || marker === undefined) return ''
      return `<path d="${edgePath(source, target, direction)}" fill="none" stroke="${escapeXml(edge.stroke)}" stroke-width="${number(edge.strokeWidth)}" opacity="${number(edge.opacity)}" marker-end="url(#${marker})" stroke-linecap="round" stroke-linejoin="round"/>`
    })
    .join('')
  const size = intrinsicSize(graph.bounds)
  const background = colorMode === 'light' ? '#ffffff' : '#0d1117'

  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="${number(graph.bounds.x)} ${number(graph.bounds.y)} ${number(graph.bounds.width)} ${number(graph.bounds.height)}" preserveAspectRatio="xMidYMid meet"><title>Issue dependency graph</title><desc>${graph.nodes.length} issues and ${graph.edges.length} dependency relationships.</desc><defs>${markers}</defs><rect x="${number(graph.bounds.x)}" y="${number(graph.bounds.y)}" width="${number(graph.bounds.width)}" height="${number(graph.bounds.height)}" fill="${background}"/>${edges}${graph.nodes.map(renderNode).join('')}</svg>`
}

const graphForSvg = (cy: Core): SvgGraph => {
  const elements = cy.elements(':visible')
  const bounds = elements.boundingBox({ includeLabels: true, includeOverlays: false })
  return {
    bounds: {
      height: Math.max(1, bounds.h + SVG_PADDING * 2),
      width: Math.max(1, bounds.w + SVG_PADDING * 2),
      x: bounds.x1 - SVG_PADDING,
      y: bounds.y1 - SVG_PADDING,
    },
    nodes: elements.nodes().map((node) => {
      const box = node.boundingBox({
        includeLabels: false,
        includeOverlays: false,
        includeUnderlays: false,
      })
      const position = node.position()
      return {
        dashArray: String(node.style('border-style')) === 'dashed' ? '6 4' : null,
        fill: String(node.style('background-color')),
        height: box.h,
        id: node.id(),
        label: String(node.data('label')),
        opacity: styleNumber(node.style('opacity'), 1),
        stroke: String(node.style('border-color')),
        strokeWidth: styleNumber(node.style('border-width'), 1),
        text: String(node.style('color')),
        width: box.w,
        x: position.x,
        y: position.y,
      }
    }),
    edges: elements.edges().map((edge) => ({
      opacity: styleNumber(edge.style('opacity'), 1),
      source: edge.source().id(),
      stroke: String(edge.style('line-color')),
      strokeWidth: styleNumber(edge.style('width'), 1),
      target: edge.target().id(),
    })),
  }
}

export const downloadSvg = (cy: Core, direction: LayoutDirection, colorMode: ColorMode): void => {
  const svg = renderGraphSvg(graphForSvg(cy), direction, colorMode)
  const anchor = document.createElement('a')
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  anchor.download = 'issue-dependency-graph.svg'
  anchor.href = url
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  queueMicrotask(() => URL.revokeObjectURL(url))
}
