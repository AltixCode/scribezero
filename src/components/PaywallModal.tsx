import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Infinity as InfinityIcon,
  FileAudio,
  FileText,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react-native';
import { useAudioStore } from '../store/useAudioStore';
import { purchaseLifetime, restorePurchases } from '../services/purchases';
import { useTheme } from '../theme/useTheme';
import { t } from '../i18n';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { setIsPro } = useAudioStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePurchase = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await purchaseLifetime();
      if (success) {
        setIsPro(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setErrorMsg(t('purchaseError'));
      }
    } catch {
      setErrorMsg(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    setErrorMsg(null);
    try {
      const success = await restorePurchases();
      if (success) {
        setIsPro(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setErrorMsg(t('noPriorPurchases'));
      }
    } catch {
      setErrorMsg(t('restoreError'));
    } finally {
      setLoading(false);
    }
  };

  const features = [
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
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopColor: theme.cardBorder,
          }}
          className="border-t rounded-t-3xl p-6 max-h-[90%] shadow-2xl"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View
                style={{
                  backgroundColor: theme.accentLight,
                  borderColor: theme.accentBorder,
                }}
                className="border p-2 rounded-xl"
              >
                <Sparkles size={20} color={theme.accent} />
              </View>
              <Text style={{ color: theme.text }} className="text-xl font-extrabold ml-2.5">
                {t('paywallTitle')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }}
              className="p-2 rounded-full"
            >
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Anti-Subscription Banner */}
          <View
            style={{
              backgroundColor: theme.accentLight,
              borderColor: theme.accentBorder,
            }}
            className="border p-4 rounded-2xl mb-5"
          >
            <Text style={{ color: theme.accent }} className="text-xs font-bold uppercase tracking-wider mb-1">
              {t('antiSubTitle')}
            </Text>
            <Text style={{ color: theme.text }} className="text-sm font-semibold leading-snug">
              {t('antiSubHeadline')}
            </Text>
          </View>

          {/* Features List */}
          <ScrollView showsVerticalScrollIndicator={false} className="space-y-3.5 mb-5">
            {features.map((f, i) => (
              <View key={i} className="flex-row items-start mb-3.5">
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderColor: theme.cardBorder,
                  }}
                  className="p-2 rounded-xl border mr-3 shadow-sm"
                >
                  {f.icon}
                </View>
                <View className="flex-1">
                  <Text style={{ color: theme.text }} className="text-sm font-bold">{f.title}</Text>
                  <Text style={{ color: theme.textSecondary }} className="text-xs mt-0.5 leading-relaxed">{f.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {errorMsg && (
            <Text style={{ color: theme.danger }} className="text-xs text-center mb-3 font-medium">{errorMsg}</Text>
          )}

          {/* Purchase Button */}
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
                <Text className="text-white font-extrabold text-base mr-2">
                  {t('lifetimeAccess')}
                </Text>
                <Check size={18} color="#FFFFFF" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>

          {/* Restore & Policy Links */}
          <View className="flex-row items-center justify-center space-x-6 mt-4">
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
        </View>
      </View>
    </Modal>
  );
};
