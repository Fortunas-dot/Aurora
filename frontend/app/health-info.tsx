import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, TagChip, LoadingSpinner } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { userService } from '../src/services/user.service';
import { useAuthStore } from '../src/store/authStore';
import { authService } from '../src/services/auth.service';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

interface HealthCondition {
  condition: string; // Hoofdconditie (bijv. "Depressie")
  type?: string; // Sub-type (bijv. "Unipolaire depressie")
  severity: SeverityLevel;
}

interface HealthInfo {
  mentalHealth?: HealthCondition[];
  physicalHealth?: HealthCondition[];
  medications?: string[];
  therapies?: string[];
}

// Betere Nederlandse terminologie gebaseerd op medische standaarden
const SEVERITY_OPTIONS: { value: SeverityLevel; label: string; description: string; color: string; icon: string }[] = [
  { 
    value: 'mild', 
    label: 'Licht', 
    description: 'Beperkte impact op dagelijks functioneren',
    color: COLORS.success, 
    icon: 'checkmark-circle' 
  },
  { 
    value: 'moderate', 
    label: 'Matig', 
    description: 'Merkbare impact, maar nog beheersbaar',
    color: COLORS.warning, 
    icon: 'alert-circle' 
  },
  { 
    value: 'severe', 
    label: 'Ernstig', 
    description: 'Significante impact op dagelijks leven',
    color: COLORS.error, 
    icon: 'warning' 
  },
];

// Condities met hun sub-types
interface ConditionWithTypes {
  name: string;
  types?: string[]; // Sub-types van deze conditie
}

const MENTAL_HEALTH_CONDITIONS: ConditionWithTypes[] = [
  {
    name: 'Depressie',
    types: [
      'Unipolaire depressie',
      'Bipolaire stoornis (manisch-depressief)',
      'Chronische depressie (Dysthymie)',
      'Seizoensgebonden depressie (SAD)',
      'Postnatale depressie',
      'Psychotische depressie',
      'Vitale depressie',
      'Atypische depressie',
      'Premenstruele stemmingsstoornis (PMDD)',
    ],
  },
  {
    name: 'Angststoornis',
    types: [
      'Gegeneraliseerde angststoornis (GAS)',
      'Paniekstoornis',
      'Sociale angststoornis',
      'Specifieke fobie',
      'Agorafobie',
      'Separatieangst',
    ],
  },
  {
    name: 'PTSS',
    types: [
      'Acute PTSS',
      'Chronische PTSS',
      'Complexe PTSS',
    ],
  },
  {
    name: 'ADHD',
    types: [
      'ADHD - Overwegend onoplettend type',
      'ADHD - Overwegend hyperactief-impulsief type',
      'ADHD - Gecombineerd type',
    ],
  },
  {
    name: 'Autisme',
    types: [
      'Autisme spectrum stoornis (ASS)',
      'Asperger syndroom',
      'PDD-NOS',
    ],
  },
  {
    name: 'Eetstoornis',
    types: [
      'Anorexia nervosa',
      'Boulimia nervosa',
      'Binge eating disorder',
      'Andere gespecificeerde eetstoornis',
    ],
  },
  {
    name: 'Verslaving',
    types: [
      'Alcoholverslaving',
      'Drugsverslaving',
      'Gokverslaving',
      'Internet/gameverslaving',
      'Andere verslaving',
    ],
  },
  {
    name: 'Borderline',
  },
  {
    name: 'OCD',
    types: [
      'OCD - Obsessies',
      'OCD - Compulsies',
      'OCD - Gemengd',
    ],
  },
  {
    name: 'Burn-out',
  },
  {
    name: 'Stress',
  },
  {
    name: 'Slaapproblemen',
    types: [
      'Insomnia',
      'Hypersomnia',
      'Slaapapneu',
      'Narcolepsie',
      'Rusteloze benen syndroom',
    ],
  },
  {
    name: 'Anders',
  },
];

const PHYSICAL_HEALTH_CONDITIONS: ConditionWithTypes[] = [
  {
    name: 'Chronische pijn',
    types: [
      'Neuropathische pijn',
      'Nociceptieve pijn',
      'Gemengde pijn',
      'Fibromyalgie',
    ],
  },
  {
    name: 'Fibromyalgie',
  },
  {
    name: 'Reuma',
    types: [
      'Reumatoïde artritis',
      'Artrose',
      'Jicht',
      'Lupus',
      'Andere reumatische aandoening',
    ],
  },
  {
    name: 'Diabetes',
    types: [
      'Type 1 diabetes',
      'Type 2 diabetes',
      'Zwangerschapsdiabetes',
    ],
  },
  {
    name: 'Hartproblemen',
    types: [
      'Hartfalen',
      'Aritmie',
      'Hoge bloeddruk',
      'Coronaire hartziekte',
      'Andere hartaandoening',
    ],
  },
  {
    name: 'Astma',
  },
  {
    name: 'Migraine',
    types: [
      'Migraine zonder aura',
      'Migraine met aura',
      'Chronische migraine',
    ],
  },
  {
    name: 'Epilepsie',
    types: [
      'Focale epilepsie',
      'Gegeneraliseerde epilepsie',
      'Onbekende oorsprong',
    ],
  },
  {
    name: 'MS',
  },
  {
    name: 'Anders',
  },
];

const MEDICATION_OPTIONS = [
  'Antidepressiva',
  'Angstremmers',
  'Slaapmedicatie',
  'Pijnstillers',
  'ADHD medicatie',
  'Stemmingsstabilisatoren',
  'Anders',
];

const THERAPY_OPTIONS = [
  'Cognitieve gedragstherapie',
  'EMDR',
  'Groepstherapie',
  'Individuele therapie',
  'Mindfulness',
  'Yoga therapie',
  'Kunsttherapie',
  'Muziektherapie',
  'Anders',
];

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
  if (!option) return null;

  const badgeSize = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View
      style={[
        styles.severityBadge,
        {
          backgroundColor: `${option.color}20`,
          borderColor: option.color,
          paddingHorizontal: size === 'sm' ? SPACING.xs : SPACING.sm,
          paddingVertical: size === 'sm' ? 2 : SPACING.xs,
        },
      ]}
    >
      <Ionicons name={option.icon as any} size={badgeSize - 4} color={option.color} />
      <Text style={[styles.severityBadgeText, { fontSize, color: option.color }]}>
        {option.label}
      </Text>
    </View>
  );
};

interface ConditionChipProps {
  condition: HealthCondition;
  onSeverityChange: (severity: SeverityLevel) => void;
  onTypeChange: (newType: string | undefined) => void;
  onRemove: () => void;
  availableTypes?: string[];
  color?: string;
}

const ConditionChip: React.FC<ConditionChipProps> = ({ 
  condition, 
  onSeverityChange, 
  onTypeChange,
  onRemove,
  availableTypes,
  color = COLORS.primary,
}) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  return (
    <View style={styles.conditionChipContainer}>
      <View style={styles.conditionChip}>
        <View style={styles.conditionInfo}>
          <Text style={styles.conditionChipText}>
            {condition.condition}
            {condition.type && (
              <Text style={styles.conditionTypeText}> • {condition.type}</Text>
            )}
          </Text>
          {availableTypes && availableTypes.length > 0 && (
            <Pressable
              style={styles.typeChangeButton}
              onPress={() => setShowTypeSelector(!showTypeSelector)}
            >
              <Ionicons 
                name={showTypeSelector ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={color} 
              />
              <Text style={[styles.typeChangeText, { color }]}>
                {condition.type ? 'Wijzig type' : 'Selecteer type'}
              </Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {/* Type Selector (expandable) */}
      {showTypeSelector && availableTypes && (
        <View style={styles.typeSelectorExpanded}>
          <Pressable
            style={styles.typeOptionInline}
            onPress={() => {
              onTypeChange(undefined);
              setShowTypeSelector(false);
            }}
          >
            <Text style={[styles.typeOptionTextInline, !condition.type && styles.typeOptionTextSelected]}>
              Algemeen
            </Text>
            {!condition.type && <Ionicons name="checkmark" size={16} color={color} />}
          </Pressable>
          {availableTypes.map((type) => (
            <Pressable
              key={type}
              style={styles.typeOptionInline}
              onPress={() => {
                onTypeChange(type);
                setShowTypeSelector(false);
              }}
            >
              <Text style={[styles.typeOptionTextInline, condition.type === type && styles.typeOptionTextSelected]}>
                {type}
              </Text>
              {condition.type === type && <Ionicons name="checkmark" size={16} color={color} />}
            </Pressable>
          ))}
        </View>
      )}
      
      {/* Inline Severity Selector */}
      <View style={styles.severitySelectorContainer}>
        <Text style={styles.severityLabel}>Ernst:</Text>
        <View style={styles.severitySelector}>
          {SEVERITY_OPTIONS.map((option) => {
            const isSelected = condition.severity === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.severityButton,
                  isSelected && {
                    backgroundColor: `${option.color}30`,
                    borderColor: option.color,
                    borderWidth: 2,
                  },
                  !isSelected && {
                    backgroundColor: COLORS.glass.backgroundDark,
                    borderColor: COLORS.glass.border,
                  },
                ]}
                onPress={() => onSeverityChange(option.value)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={16} 
                  color={isSelected ? option.color : COLORS.textMuted} 
                />
                <Text
                  style={[
                    styles.severityButtonText,
                    isSelected && { color: option.color, fontWeight: '600' },
                    !isSelected && { color: COLORS.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

interface CategorySectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  conditions: ConditionWithTypes[];
  selected: HealthCondition[];
  onAdd: (condition: string, type?: string) => void;
  onUpdate: (condition: string, type: string | undefined, severity: SeverityLevel) => void;
  onUpdateType: (condition: string, oldType: string | undefined, newType: string | undefined) => void;
  onRemove: (condition: string, type: string | undefined) => void;
  color?: string;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  icon,
  conditions,
  selected,
  onAdd,
  onUpdate,
  onUpdateType,
  onRemove,
  color = COLORS.primary,
}) => {
  const [selectedCondition, setSelectedCondition] = React.useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = React.useState(false);

  const handleConditionSelect = (conditionName: string) => {
    const condition = conditions.find((c) => c.name === conditionName);
    if (condition?.types && condition.types.length > 0) {
      setSelectedCondition(conditionName);
      setShowTypeModal(true);
    } else {
      onAdd(conditionName);
    }
  };

  const handleTypeSelect = (type: string) => {
    if (selectedCondition) {
      onAdd(selectedCondition, type);
      setShowTypeModal(false);
      setSelectedCondition(null);
    }
  };

  // Filter: show conditions that aren't fully selected (can have multiple types of same condition)
  const availableConditions = conditions.filter((c) => {
    // Always show conditions, users can add multiple types
    return true;
  });

  return (
    <>
      <GlassCard style={styles.categoryCard} padding="lg">
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>

        {/* Selected Conditions */}
        {selected.length > 0 && (
          <View style={styles.selectedConditions}>
            {selected.map((item, index) => {
              const key = `${item.condition}-${item.type || 'none'}-${index}`;
              return (
                <ConditionChip
                  key={key}
                  condition={item}
                  onSeverityChange={(severity) => onUpdate(item.condition, item.type, severity)}
                  onTypeChange={(newType) => onUpdateType(item.condition, item.type, newType)}
                  onRemove={() => onRemove(item.condition, item.type)}
                  availableTypes={conditions.find((c) => c.name === item.condition)?.types}
                  color={color}
                />
              );
            })}
          </View>
        )}

        {/* Available Options */}
        {availableConditions.length > 0 && (
          <View style={styles.optionsGrid}>
            {availableConditions.map((condition) => {
              const hasTypes = condition.types && condition.types.length > 0;
              return (
                <Pressable
                  key={condition.name}
                  style={styles.optionChip}
                  onPress={() => handleConditionSelect(condition.name)}
                >
                  <Text style={styles.optionChipText}>{condition.name}</Text>
                  {hasTypes && (
                    <Ionicons name="chevron-down" size={16} color={color} style={styles.addIcon} />
                  )}
                  {!hasTypes && (
                    <Ionicons name="add-circle-outline" size={18} color={color} style={styles.addIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </GlassCard>

      {/* Type Selection Modal */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowTypeModal(false);
          setSelectedCondition(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowTypeModal(false);
            setSelectedCondition(null);
          }}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Selecteer type {selectedCondition}
              </Text>
              <Pressable
                onPress={() => {
                  setShowTypeModal(false);
                  setSelectedCondition(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalTypesList}>
              {selectedCondition && (
                <>
                  {conditions
                    .find((c) => c.name === selectedCondition)
                    ?.types?.map((type) => (
                      <Pressable
                        key={type}
                        style={styles.typeOption}
                        onPress={() => handleTypeSelect(type)}
                      >
                        <Text style={styles.typeOptionText}>{type}</Text>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                      </Pressable>
                    ))}
                  <Pressable
                    style={styles.typeOption}
                    onPress={() => {
                      onAdd(selectedCondition);
                      setShowTypeModal(false);
                      setSelectedCondition(null);
                    }}
                  >
                    <Text style={styles.typeOptionText}>Algemeen (geen specifiek type)</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </Pressable>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default function HealthInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser } = useAuthStore();

  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    mentalHealth: [],
    physicalHealth: [],
    medications: [],
    therapies: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Load existing health info and convert old format to new format
    const convertToNewFormat = (oldData: any[]): HealthCondition[] => {
      if (!oldData || oldData.length === 0) return [];
      // Check if it's old format (string[]) or new format (HealthCondition[])
      if (typeof oldData[0] === 'string') {
        return oldData.map((item: string) => ({ 
          condition: item, 
          type: undefined,
          severity: 'moderate' as SeverityLevel 
        }));
      }
      // Ensure type field exists
      return oldData.map((item: any) => ({
        condition: item.condition || item,
        type: item.type,
        severity: item.severity || 'moderate',
      }));
    };

    if (user?.healthInfo) {
      setHealthInfo({
        mentalHealth: convertToNewFormat(user.healthInfo.mentalHealth),
        physicalHealth: convertToNewFormat(user.healthInfo.physicalHealth),
        medications: user.healthInfo.medications || [],
        therapies: user.healthInfo.therapies || [],
      });
    } else {
      // Reset to empty if no healthInfo exists
      setHealthInfo({
        mentalHealth: [],
        physicalHealth: [],
        medications: [],
        therapies: [],
      });
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  const handleAddCondition = (category: 'mentalHealth' | 'physicalHealth', condition: string, type?: string) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      // Check if this exact combination already exists
      const exists = current.some(
        (item) => item.condition === condition && item.type === type
      );
      if (exists) return prev;

      return {
        ...prev,
        [category]: [...current, { condition, type, severity: 'moderate' as SeverityLevel }],
      };
    });
  };

  const handleUpdateSeverity = (category: 'mentalHealth' | 'physicalHealth', condition: string, type: string | undefined, severity: SeverityLevel) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.map((item) =>
          item.condition === condition && item.type === type
            ? { ...item, severity }
            : item
        ),
      };
    });
  };

  const handleUpdateType = (category: 'mentalHealth' | 'physicalHealth', condition: string, oldType: string | undefined, newType: string | undefined) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.map((item) =>
          item.condition === condition && item.type === oldType
            ? { ...item, type: newType }
            : item
        ),
      };
    });
  };

  const handleRemoveCondition = (category: 'mentalHealth' | 'physicalHealth', condition: string, type: string | undefined) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.filter(
          (item) => !(item.condition === condition && item.type === type)
        ),
      };
    });
  };

  const handleAddSimple = (category: 'medications' | 'therapies', item: string) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item];
      return {
        ...prev,
        [category]: updated,
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await userService.updateProfile({
        healthInfo,
      });

      if (response.success && response.data) {
        // Fetch the updated user to ensure we have the latest data
        const userResponse = await authService.getMe();
        if (userResponse.success && userResponse.data) {
          updateUser(userResponse.data);
        } else {
          // Fallback: update with response data
          updateUser({
            healthInfo: response.data.healthInfo,
          });
        }
        router.back();
      } else {
        Alert.alert('Fout', response.message || 'Kon gezondheidsinformatie niet bijwerken');
      }
    } catch (error: any) {
      console.error('Error updating health info:', error);
      Alert.alert('Fout', 'Er ging iets mis bij het bijwerken van je gezondheidsinformatie');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <LinearGradient colors={COLORS.backgroundGradient} style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Gezondheidsinformatie</Text>
        <Pressable
          style={[styles.headerIconButton, isSubmitting && styles.headerIconButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Deel informatie over je mentale en fysieke gezondheid. Selecteer een conditie en kies direct de ernst met de knoppen eronder.
        </Text>

        <CategorySection
          title="Mentale gezondheid"
          icon="heart-outline"
          conditions={MENTAL_HEALTH_CONDITIONS}
          selected={healthInfo.mentalHealth || []}
          onAdd={(condition, type) => handleAddCondition('mentalHealth', condition, type)}
          onUpdate={(condition, type, severity) => handleUpdateSeverity('mentalHealth', condition, type, severity)}
          onUpdateType={(condition, oldType, newType) => handleUpdateType('mentalHealth', condition, oldType, newType)}
          onRemove={(condition, type) => handleRemoveCondition('mentalHealth', condition, type)}
          color={COLORS.error}
        />

        <CategorySection
          title="Fysieke gezondheid"
          icon="body-outline"
          conditions={PHYSICAL_HEALTH_CONDITIONS}
          selected={healthInfo.physicalHealth || []}
          onAdd={(condition, type) => handleAddCondition('physicalHealth', condition, type)}
          onUpdate={(condition, type, severity) => handleUpdateSeverity('physicalHealth', condition, type, severity)}
          onUpdateType={(condition, oldType, newType) => handleUpdateType('physicalHealth', condition, oldType, newType)}
          onRemove={(condition, type) => handleRemoveCondition('physicalHealth', condition, type)}
          color={COLORS.warning}
        />

        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.info}20` }]}>
              <Ionicons name="medical-outline" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.categoryTitle}>Medicatie</Text>
          </View>

          {healthInfo.medications && healthInfo.medications.length > 0 && (
            <View style={styles.selectedConditions}>
              {healthInfo.medications.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.conditionChip}
                  onPress={() => handleAddSimple('medications', item)}
                >
                  <Text style={styles.conditionChipText}>{item}</Text>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.optionsGrid}>
            {MEDICATION_OPTIONS.filter((opt) => !healthInfo.medications?.includes(opt)).map((option) => (
              <Pressable
                key={option}
                style={styles.optionChip}
                onPress={() => handleAddSimple('medications', option)}
              >
                <Text style={styles.optionChipText}>{option}</Text>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.info} style={styles.addIcon} />
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.success}20` }]}>
              <Ionicons name="fitness-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.categoryTitle}>Therapieën</Text>
          </View>

          {healthInfo.therapies && healthInfo.therapies.length > 0 && (
            <View style={styles.selectedConditions}>
              {healthInfo.therapies.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.conditionChip}
                  onPress={() => handleAddSimple('therapies', item)}
                >
                  <Text style={styles.conditionChipText}>{item}</Text>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.optionsGrid}>
            {THERAPY_OPTIONS.filter((opt) => !healthInfo.therapies?.includes(opt)).map((option) => (
              <Pressable
                key={option}
                style={styles.optionChip}
                onPress={() => handleAddSimple('therapies', option)}
              >
                <Text style={styles.optionChipText}>{option}</Text>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.success} style={styles.addIcon} />
              </Pressable>
            ))}
          </View>
        </GlassCard>

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
          <Text style={styles.privacyNoteText}>
            Deze informatie is privé en wordt alleen gedeeld met mensen die je vertrouwt.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  categoryCard: {
    marginBottom: SPACING.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  selectedConditions: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  conditionChipContainer: {
    marginBottom: SPACING.sm,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundLight,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    marginBottom: SPACING.xs,
  },
  conditionInfo: {
    flex: 1,
  },
  conditionChipText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    flex: 1,
  },
  conditionTypeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  typeChangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  typeChangeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
  typeSelectorExpanded: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  typeOptionInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.background,
  },
  typeOptionTextInline: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    flex: 1,
  },
  typeOptionTextSelected: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    flex: 1,
  },
  modalTypesList: {
    maxHeight: 400,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  typeOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  removeButton: {
    marginLeft: SPACING.sm,
  },
  severitySelectorContainer: {
    marginTop: SPACING.xs,
  },
  severityLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  severitySelector: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  severityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.xs / 2,
  },
  severityButtonText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  severityBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.xs,
  },
  optionChipText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  addIcon: {
    marginLeft: SPACING.xs,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    gap: SPACING.sm,
  },
  privacyNoteText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
