import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  BadgeCheck,
  Infinity as InfinityIcon,
  FileAudio,
  FileText,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { useAudioStore } from '../src/store/useAudioStore';
import { usePaywall } from '../src/hooks/usePaywall';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../src/config/legal';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';
import { t } from '../src/i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const theme = useTheme();
  const tabletColumn = useTabletColumn(640);
  const { ctaLabel, loading, errorMsg, handlePurchase, handleRestore } =
    usePaywall(() => router.back());

  const features = [
    // Ad removal leads the list: it is what the store product is named after, and it is the
    // benefit a free user has been feeling rather than reading about.
    {
      icon: <BadgeCheck size={20} color={theme.primary} />,
      title: t('featAdsTitle'),
      desc: t('featAdsDesc'),
    },
    {
      icon: <InfinityIcon size={20} color={theme.accent} />,
      title: t('feat1Title'),
      desc: t('feat1Desc'),
    },
    {
      icon: <FileAudio size={20} color="#A855F7" />,
      title: t('feat2Title'),
      desc: t('feat2Desc'),
    },
    {
      icon: <FileText size={20} color={theme.warning} />,
      title: t('feat3Title'),
      desc: t('feat3Desc'),
    },
    {
      icon: <ShieldCheck size={20} color={theme.success} />,
      title: t('feat4Title'),
      desc: t('feat4Desc'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} className="px-6 py-4">
      {/* Top Header */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: theme.accentLight,
              borderColor: theme.accentBorder,
            }}
            className="border p-2 rounded-xl mr-2.5"
          >
            <Sparkles size={20} color={theme.accent} />
          </View>
          <Text style={{ color: theme.text }} className="text-xl font-extrabold">{t('paywallTitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          // An icon-only button with no label reaches VoiceOver as "button" and
          // nothing else, which on the one control that dismisses a paywall is
          // the worst place for it.
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
          }}
          className="p-2 rounded-full"
        >
          <X size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* The scroll area and the pinned CTA are ONE block, centred together.
          Centring the scroll content alone was worse than the problem it
          replaced: on this shape the CTA is pinned OUTSIDE the ScrollView, so
          only the middle moved and a second void opened above the content.
          Measured on a 13" iPad: header 11%, void 25%, content 25%, void 26%,
          CTA 13% -- 51% empty in two slabs, against one 45% slab before.
          Wrapping both and letting the scroll view hug its content keeps the
          button attached to what it is buying. */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ ...tabletColumn }}>
        {/* Anti-Subscription Card */}
        <View
          style={{
            backgroundColor: theme.accentLight,
            borderColor: theme.accentBorder,
          }}
          className="border p-5 rounded-2xl mb-6 shadow-sm"
        >
          <Text style={{ color: theme.accent }} className="text-xs font-bold uppercase tracking-wider mb-1">
            {t('antiSubTitle')}
          </Text>
          <Text style={{ color: theme.text }} className="text-base font-bold leading-snug">
            {t('antiSubHeadline')}
          </Text>
          <Text style={{ color: theme.textSecondary }} className="text-xs mt-2 leading-relaxed">
            {t('antiSubDesc')}
          </Text>
        </View>

        {/* Features List */}
        <View className="flex-col gap-4 mb-6">
          {features.map((f, i) => (
            <View key={i} className="flex-row items-start mb-4">
              <View
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                }}
                className="p-2.5 rounded-xl border mr-3.5 shadow-sm"
              >
                {f.icon}
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-sm font-bold">{f.title}</Text>
                <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {errorMsg && (
          <Text style={{ color: theme.danger }} className="text-xs text-center mb-3">{errorMsg}</Text>
        )}
      </ScrollView>

      {/* Bottom CTA Area */}
      <View className="pt-2 pb-6">
        <TouchableOpacity
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          }}
          className="p-4 rounded-2xl items-center flex-row justify-center min-h-[52px]"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="font-extrabold text-base mr-2" style={{ color: theme.text }}>
                {ctaLabel}
              </Text>
              <Check size={18} color="#FFFFFF" strokeWidth={3} />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center gap-6 mt-4">
          <TouchableOpacity
            onPress={handleRestore}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: theme.textSecondary }} className="text-xs underline font-medium">
              {t('restorePurchases')}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: theme.textMuted }} className="text-xs">•</Text>
          <Text style={{ color: theme.textMuted }} className="text-xs font-medium">
            {t('oneTimePayment')}
          </Text>
        </View>
        <View className="mt-3 flex-row items-center justify-center gap-5">
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={{ color: theme.textMuted }} className="text-xs underline">
              {t('termsOfUse')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          >
            <Text style={{ color: theme.textMuted }} className="text-xs underline">
              {t('privacyPolicy')}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
      </View>
    </View>
  );
}
