import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Download, ShieldCheck, X } from "lucide-react-native";
import { downloadModel, getModelStatus } from "../services/modelManager";
import { useTheme } from "../theme/useTheme";
import { t } from "../i18n";

interface ModelGateProps {
  visible: boolean;
  onReady: () => void;
  onCancel: () => void;
}

/**
 * Fetches the speech model the first time the user transcribes something.
 *
 * The download is the only network request the app makes. It is surfaced
 * explicitly, with its size and what it is for, rather than happening quietly:
 * the app's whole proposition is that audio never leaves the device, and a
 * silent ~75 MB transfer would reasonably look like the opposite.
 */
export const ModelGate: React.FC<ModelGateProps> = ({
  visible,
  onReady,
  onCancel,
}) => {
  const theme = useTheme();
  const [downloading, setDownloading] = useState(false);
  const [fraction, setFraction] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setDownloading(false);
      setFraction(0);
      setError(null);
    }
  }, [visible]);

  const start = async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadModel((progress) => setFraction(progress.fraction));
      const status = await getModelStatus();
      if (!status.ready) throw new Error(t("modelDownloadFailed"));
      onReady();
    } catch (err) {
      setError(
        (err as { message?: string })?.message ?? t("modelDownloadFailed"),
      );
    } finally {
      setDownloading(false);
    }
  };

  const percent = fraction === null ? null : Math.round(fraction * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-8">
        <View
          style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          className="w-full rounded-3xl border p-6"
        >
          <View className="mb-4 flex-row items-start justify-between">
            <View
              style={{ backgroundColor: theme.primaryLight }}
              className="rounded-2xl p-3"
            >
              <Download size={22} color={theme.primary} />
            </View>
            {!downloading ? (
              <TouchableOpacity
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={t("cancel")}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <X size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <Text
            style={{ color: theme.text }}
            className="text-lg font-extrabold"
          >
            {t("modelNeededTitle")}
          </Text>
          <Text
            style={{ color: theme.textSecondary }}
            className="mt-2 text-sm leading-relaxed"
          >
            {t("modelNeededDesc")}
          </Text>

          <View className="mt-4 flex-row items-start">
            <ShieldCheck size={16} color={theme.success} />
            <Text
              style={{ color: theme.textSecondary }}
              className="ml-2 flex-1 text-xs leading-relaxed"
            >
              {t("modelPrivacyNote")}
            </Text>
          </View>

          {error ? (
            <Text
              accessibilityRole="alert"
              style={{ color: theme.danger }}
              className="mt-4 text-xs"
            >
              {error}
            </Text>
          ) : null}

          {downloading ? (
            <View className="mt-6">
              <View
                style={{ backgroundColor: theme.controlSurface }}
                className="h-2 w-full overflow-hidden rounded-full"
              >
                <View
                  style={{
                    backgroundColor: theme.primary,
                    width: percent === null ? "100%" : `${percent}%`,
                  }}
                  className="h-full rounded-full"
                />
              </View>
              <View className="mt-2 flex-row items-center justify-center">
                <ActivityIndicator size="small" color={theme.primary} />
                <Text
                  style={{ color: theme.textSecondary }}
                  className="ml-2 text-xs"
                >
                  {percent === null
                    ? t("modelDownloading")
                    : t("modelDownloadingPercent", { percent })}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={start}
              accessibilityRole="button"
              style={{ backgroundColor: theme.primary }}
              className="mt-6 min-h-[52px] items-center justify-center rounded-2xl"
            >
              <Text
                style={{ color: theme.onPrimary }}
                className="text-base font-bold"
              >
                {t("modelDownloadCta")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};
