import type { DocEntry } from '@blackwork/docs'
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { socialImageSize } from './social-metadata'

// Bundle the full SC font so new Chinese pages render without font-service requests.
const font = readFile(join(process.cwd(), 'assets/fonts/NotoSansSC-Regular.woff'))

export async function createSocialImage(entry: DocEntry, description: string) {
  const fontData = await font

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '64px 72px',
          background: '#0b1110',
          color: '#f1f5f3',
          fontFamily: 'Noto Sans SC',
          borderTop: '8px solid #10b981',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#10b981',
              color: '#0b1110',
              fontSize: 28,
            }}
          >
            {'>_'}
          </div>
          <div style={{ display: 'flex', fontSize: 28 }}>Create Preset</div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.2,
              lineClamp: 2,
              textOverflow: 'ellipsis',
            }}
          >
            {entry.title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.5,
              color: '#a8bdb4',
              lineClamp: 3,
              textOverflow: 'ellipsis',
            }}
          >
            {description}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 24,
            borderTop: '1px solid #294038',
            color: '#7dd3b0',
            fontSize: 22,
          }}
        >
          <div style={{ display: 'flex' }}>preset.js.org</div>
          <div style={{ display: 'flex' }}>{entry.href}</div>
        </div>
      </div>
    ),
    {
      ...socialImageSize,
      fonts: [
        { name: 'Noto Sans SC', data: fontData, weight: 400, style: 'normal' },
      ],
    },
  )
}
