// Visuel produit avec repli : si le CDN Shopify est lent ou injoignable (salle de pitch, 3G…),
// le logo PlushUp reste affiché derrière — jamais de case vide.
import { useState } from 'react';
import { Image, View } from 'react-native';

import { PRODUCT_IMAGE } from '@/lib/constants';
import { colors, radius } from '@/theme/tokens';

import { WaveMark } from './Wave';

export function ProductImage({ size = 64 }: { size?: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <View style={{ width: size, height: size, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.deep, alignItems: 'center', justifyContent: 'center' }}>
      {!loaded ? <WaveMark size={size * 0.7} /> : null}
      <Image
        source={{ uri: PRODUCT_IMAGE }}
        onLoad={() => setLoaded(true)}
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', width: size, height: size, opacity: loaded ? 1 : 0 }}
      />
    </View>
  );
}
