import { newId } from '@/core/id'
import { DEFAULT_FONT } from '@/core/fonts'
import { PALETTE } from '@/core/palette'
import type {
  ElementDoc,
  ImageElement,
  ImageFit,
  ImageTone,
  ShapeElement,
  ShapeKind,
  TextElement,
} from '@/types/project'

/** 深拷贝（文档是纯 JSON 数据，不涉及 Date / Map / 循环引用） */
export function cloneDoc<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

type BaseFields = Pick<
  ElementDoc,
  'x' | 'y' | 'width' | 'height' | 'rotation' | 'opacity' | 'visible' | 'locked' | 'name'
>

function base(init: Partial<BaseFields>): BaseFields {
  return {
    name: '元素',
    x: 40,
    y: 40,
    width: 200,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    ...init,
  }
}

export function createText(init: Partial<TextElement> & { text?: string } = {}): TextElement {
  const b = base(init)
  return {
    id: init.id ?? newId('txt'),
    type: 'text',
    ...b,
    name: b.name === '元素' ? '文字' : b.name,
    text: init.text ?? '在此输入文字',
    fontSize: init.fontSize ?? 16,
    fontFamily: init.fontFamily ?? DEFAULT_FONT,
    fontStyle: init.fontStyle ?? 'normal',
    align: init.align ?? 'left',
    verticalAlign: init.verticalAlign ?? 'top',
    lineHeight: init.lineHeight ?? 1.6,
    letterSpacing: init.letterSpacing ?? 0,
    fill: init.fill ?? PALETTE.ink,
    autoHeight: init.autoHeight ?? true,
    padding: init.padding ?? 0,
  }
}

export function createShape(
  shape: ShapeKind,
  init: Partial<ShapeElement> = {},
): ShapeElement {
  const b = base(init)
  return {
    id: init.id ?? newId('shp'),
    type: 'shape',
    ...b,
    name: b.name === '元素' ? shapeName(shape) : b.name,
    shape,
    fill: init.fill ?? 'transparent',
    stroke: init.stroke ?? PALETTE.ink,
    strokeWidth: init.strokeWidth ?? 1,
    cornerRadius: init.cornerRadius ?? 0,
    dash: init.dash ?? [],
    text: init.text,
    textColor: init.textColor ?? PALETTE.rust,
    fontSize: init.fontSize ?? 14,
  }
}

export function createImage(
  assetId: string,
  init: Partial<ImageElement> = {},
): ImageElement {
  const b = base(init)
  return {
    id: init.id ?? newId('img'),
    type: 'image',
    ...b,
    name: b.name === '元素' ? '图片' : b.name,
    assetId,
    fit: (init.fit ?? 'cover') as ImageFit,
    tone: (init.tone ?? 'none') as ImageTone,
    cornerRadius: init.cornerRadius ?? 0,
    stroke: init.stroke ?? 'transparent',
    strokeWidth: init.strokeWidth ?? 0,
  }
}

function shapeName(kind: ShapeKind): string {
  const map: Record<ShapeKind, string> = {
    rect: '矩形',
    ellipse: '椭圆',
    line: '线条',
    frame: '边框',
    seal: '印章',
  }
  return map[kind]
}

/** 复制元素：新 id、偏移、名字加副本后缀 */
export function duplicateElement(el: ElementDoc, offset = 18): ElementDoc {
  const copy = cloneDoc(el)
  copy.id = newId(el.type === 'text' ? 'txt' : el.type === 'image' ? 'img' : 'shp')
  copy.x += offset
  copy.y += offset
  copy.name = `${el.name} 副本`
  return copy
}
