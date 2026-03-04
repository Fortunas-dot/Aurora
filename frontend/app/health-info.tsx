import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassButton, TagChip, LoadingSpinner, GlassInput } from '../src/components/common';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../src/constants/theme';
import { userService } from '../src/services/user.service';
import { useAuthStore } from '../src/store/authStore';
import { authService } from '../src/services/auth.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COUNTRIES } from '../src/constants/countries';

type SeverityLevel = 'mild' | 'moderate' | 'severe';

interface HealthCondition {
  condition: string; // Hoofdconditie (bijv. "Depressie")
  type?: string; // Sub-type (bijv. "Unipolaire depressie")
  severity: SeverityLevel;
  notes?: string; // Additional context/explanation for this condition
}

interface HealthInfo {
  mentalHealth?: HealthCondition[];
  physicalHealth?: HealthCondition[];
  medications?: string[];
  therapies?: string[];
  // Basic profile-style info that helps interpret health context
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  lifestyle?: {
    smoking?: string;
    alcohol?: string;
    drugs?: string;
    physicalActivity?: string;
    diet?: string;
    sleep?: string;
  };
  lifeContext?: string; // General context about user's life for AI
}

// Medical terminology based on standards
const SEVERITY_OPTIONS: { value: SeverityLevel; label: string; description: string; color: string; icon: string }[] = [
  { 
    value: 'mild', 
    label: 'Mild', 
    description: 'Limited impact on daily functioning',
    color: COLORS.success, 
    icon: 'checkmark-circle' 
  },
  { 
    value: 'moderate', 
    label: 'Moderate', 
    description: 'Noticeable impact, but still manageable',
    color: COLORS.warning, 
    icon: 'alert-circle' 
  },
  { 
    value: 'severe', 
    label: 'Severe', 
    description: 'Significant impact on daily life',
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
    name: 'No diagnosis',
  },
  {
    name: 'Depression',
    types: [
      'Unipolar depression',
      'Bipolar disorder (manic-depressive)',
      'Chronic depression (Dysthymia)',
      'Seasonal affective disorder (SAD)',
      'Postnatal depression',
      'Psychotic depression',
      'Vital depression',
      'Atypical depression',
      'Premenstrual dysphoric disorder (PMDD)',
    ],
  },
  {
    name: 'Anxiety Disorder',
    types: [
      'Generalized anxiety disorder (GAD)',
      'Panic disorder',
      'Social anxiety disorder',
      'Specific phobia',
      'Agoraphobia',
      'Separation anxiety',
    ],
  },
  {
    name: 'PTSD',
    types: [
      'Acute PTSD',
      'Chronic PTSD',
      'Complex PTSD',
    ],
  },
  {
    name: 'ADHD',
    types: [
      'ADHD - Predominantly inattentive type',
      'ADHD - Predominantly hyperactive-impulsive type',
      'ADHD - Combined type',
    ],
  },
  {
    name: 'Autism',
    types: [
      'Autism spectrum disorder (ASD)',
      'Asperger syndrome',
      'PDD-NOS',
    ],
  },
  {
    name: 'Eating Disorder',
    types: [
      'Anorexia nervosa',
      'Bulimia nervosa',
      'Binge eating disorder',
      'Other specified eating disorder',
    ],
  },
  {
    name: 'Addiction',
    types: [
      'Alcohol addiction',
      'Drug addiction',
      'Gambling addiction',
      'Internet/gaming addiction',
      'Other addiction',
    ],
  },
  {
    name: 'Borderline',
  },
  {
    name: 'OCD',
    types: [
      'OCD - Obsessions',
      'OCD - Compulsions',
      'OCD - Mixed',
    ],
  },
  {
    name: 'Burnout',
  },
  {
    name: 'Stress',
  },
  {
    name: 'Sleep Problems',
    types: [
      'Insomnia',
      'Hypersomnia',
      'Sleep apnea',
      'Narcolepsy',
      'Restless legs syndrome',
    ],
  },
  {
    name: 'Other',
  },
];

const PHYSICAL_HEALTH_CONDITIONS: ConditionWithTypes[] = [
  {
    name: 'Generally healthy',
  },
  {
    name: 'Chronic Pain',
    types: [
      'Neuropathic pain',
      'Nociceptive pain',
      'Mixed pain',
      'Fibromyalgia',
    ],
  },
  {
    name: 'Fibromyalgia',
  },
  {
    name: 'Rheumatism',
    types: [
      'Rheumatoid arthritis',
      'Osteoarthritis',
      'Gout',
      'Lupus',
      'Other rheumatic condition',
    ],
  },
  {
    name: 'Diabetes',
    types: [
      'Type 1 diabetes',
      'Type 2 diabetes',
      'Gestational diabetes',
    ],
  },
  {
    name: 'Heart Problems',
    types: [
      'Heart failure',
      'Arrhythmia',
      'High blood pressure',
      'Coronary heart disease',
      'Other heart condition',
    ],
  },
  {
    name: 'Asthma',
  },
  {
    name: 'Migraine',
    types: [
      'Migraine without aura',
      'Migraine with aura',
      'Chronic migraine',
    ],
  },
  {
    name: 'Epilepsy',
    types: [
      'Focal epilepsy',
      'Generalized epilepsy',
      'Unknown origin',
    ],
  },
  {
    name: 'MS',
  },
  {
    name: 'Other',
  },
];

const MEDICATION_OPTIONS = [
  'None',
  'Antidepressants',
  'Anxiety medication',
  'Sleep medication',
  'Painkillers',
  'ADHD medication',
  'Mood stabilizers',
  'Other',
];

const THERAPY_OPTIONS = [
  'None',
  'Cognitive Behavioral Therapy',
  'EMDR',
  'Group therapy',
  'Individual therapy',
  'Mindfulness',
  'Yoga therapy',
  'Art therapy',
  'Music therapy',
  'Other',
];

// Custom date picker options
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  '01', '02', '03', '04', '05', '06',
  '07', '08', '09', '10', '11', '12',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

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
  onNotesChange: (notes: string) => void;
  onRemove: () => void;
  availableTypes?: string[];
  color?: string;
}

const ConditionChip: React.FC<ConditionChipProps> = ({ 
  condition, 
  onSeverityChange, 
  onTypeChange,
  onNotesChange,
  onRemove,
  availableTypes,
  color = COLORS.primary,
}) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesText, setNotesText] = useState(condition.notes || '');

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
                {condition.type ? 'Change type' : 'Select type'}
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
              General
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
        <Text style={styles.severityLabel}>Severity:</Text>
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

      {/* Notes Input */}
      <View style={styles.notesContainer}>
        <Pressable
          style={styles.notesToggleButton}
          onPress={() => setShowNotesInput(!showNotesInput)}
        >
          <Ionicons 
            name={showNotesInput ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={color} 
          />
          <Text style={[styles.notesToggleText, { color }]}>
            {condition.notes ? 'Edit context/explanation' : 'Add context/explanation (optional)'}
          </Text>
        </Pressable>
        {showNotesInput && (
          <View style={styles.notesInputContainer}>
            <TextInput
              style={styles.notesInput}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Provide additional context or explanation about this condition..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.notesInputActions}>
              <Pressable
                style={[styles.notesInputButton, styles.notesInputButtonCancel]}
                onPress={() => {
                  setNotesText(condition.notes || '');
                  setShowNotesInput(false);
                }}
              >
                <Text style={styles.notesInputButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.notesInputButton, styles.notesInputButtonSave]}
                onPress={() => {
                  onNotesChange(notesText.trim());
                  setShowNotesInput(false);
                }}
              >
                <Text style={styles.notesInputButtonTextSave}>Save</Text>
              </Pressable>
            </View>
            {condition.notes && (
              <Text style={styles.notesPreview}>
                Current: {condition.notes}
              </Text>
            )}
          </View>
        )}
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
  onUpdateNotes: (condition: string, type: string | undefined, notes: string) => void;
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
  onUpdateNotes,
  onRemove,
  color = COLORS.primary,
}) => {
  const [selectedCondition, setSelectedCondition] = React.useState<string | null>(null);
  const [showTypeModal, setShowTypeModal] = React.useState(false);
  const [showOtherInput, setShowOtherInput] = React.useState(false);
  const [otherTypeText, setOtherTypeText] = React.useState('');

  const handleConditionSelect = (conditionName: string) => {
    const condition = conditions.find((c) => c.name === conditionName);
    
    // If "Other" is selected, show input field
    if (conditionName === 'Other') {
      setSelectedCondition('Other');
      setShowOtherInput(true);
      setOtherTypeText('');
      return;
    }
    
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

  const handleOtherSubmit = () => {
    if (otherTypeText.trim()) {
      onAdd('Other', otherTypeText.trim());
      setShowOtherInput(false);
      setOtherTypeText('');
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
                  onNotesChange={(notes) => onUpdateNotes(item.condition, item.type, notes)}
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
              const isOther = condition.name === 'Other';
              return (
                <Pressable
                  key={condition.name}
                  style={styles.optionChip}
                  onPress={() => handleConditionSelect(condition.name)}
                >
                  <Text style={styles.optionChipText}>{condition.name}</Text>
                  {hasTypes && !isOther && (
                    <Ionicons name="chevron-down" size={16} color={color} style={styles.addIcon} />
                  )}
                  {!hasTypes && !isOther && (
                    <Ionicons name="add-circle-outline" size={18} color={color} style={styles.addIcon} />
                  )}
                  {isOther && (
                    <Ionicons name="create-outline" size={18} color={color} style={styles.addIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Other Input Field */}
        {showOtherInput && selectedCondition === 'Other' && (
          <View style={styles.otherInputContainer}>
              <GlassInput
                value={otherTypeText}
                onChangeText={setOtherTypeText}
                placeholder="Enter condition type..."
                style={styles.otherInput}
              />
            <View style={styles.otherInputActions}>
              <Pressable
                style={[styles.otherInputButton, styles.otherInputButtonCancel]}
                onPress={() => {
                  setShowOtherInput(false);
                  setOtherTypeText('');
                  setSelectedCondition(null);
                }}
              >
                <Text style={styles.otherInputButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.otherInputButton, styles.otherInputButtonSubmit, !otherTypeText.trim() && styles.otherInputButtonDisabled]}
                onPress={handleOtherSubmit}
                disabled={!otherTypeText.trim()}
              >
                <Text style={styles.otherInputButtonTextSubmit}>Add</Text>
              </Pressable>
            </View>
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
                Select type for {selectedCondition}
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
              {selectedCondition && selectedCondition !== 'Other' && (
                <>
                  {conditions
                    .find((c) => c.name === selectedCondition)
                    ?.types?.map((type) => {
                      // Check if this type is "Other" or contains "Other"
                      const isOtherType = type.toLowerCase().includes('other') || type === 'Other';
                      
                      return (
                        <Pressable
                          key={type}
                          style={styles.typeOption}
                          onPress={() => {
                            if (isOtherType) {
                              // Show input for "Other" type
                              setShowTypeModal(false);
                              setShowOtherInput(true);
                              setOtherTypeText('');
                            } else {
                              handleTypeSelect(type);
                            }
                          }}
                        >
                          <Text style={styles.typeOptionText}>{type}</Text>
                          <Ionicons name={isOtherType ? "create-outline" : "chevron-forward"} size={20} color={COLORS.textMuted} />
                        </Pressable>
                      );
                    })}
                  <Pressable
                    style={styles.typeOption}
                    onPress={() => {
                      onAdd(selectedCondition);
                      setShowTypeModal(false);
                      setSelectedCondition(null);
                    }}
                  >
                    <Text style={styles.typeOptionText}>General (no specific type)</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </Pressable>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Other Input Modal (when Other is selected from type list) */}
      {showOtherInput && selectedCondition && selectedCondition !== 'Other' && (
        <Modal
          visible={showOtherInput}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowOtherInput(false);
            setOtherTypeText('');
            setSelectedCondition(null);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowOtherInput(false);
              setOtherTypeText('');
              setSelectedCondition(null);
            }}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Enter type for {selectedCondition}
                </Text>
                <Pressable
                  onPress={() => {
                    setShowOtherInput(false);
                    setOtherTypeText('');
                    setSelectedCondition(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>

              <View style={styles.modalOtherInputContainer}>
                <GlassInput
                  value={otherTypeText}
                  onChangeText={setOtherTypeText}
                  placeholder="Enter condition type..."
                  style={styles.modalOtherInput}
                />
                <View style={styles.modalOtherInputActions}>
                  <Pressable
                    style={[styles.modalOtherInputButton, styles.modalOtherInputButtonCancel]}
                    onPress={() => {
                      setShowOtherInput(false);
                      setOtherTypeText('');
                      setSelectedCondition(null);
                    }}
                  >
                    <Text style={styles.modalOtherInputButtonTextCancel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalOtherInputButton, styles.modalOtherInputButtonSubmit, !otherTypeText.trim() && styles.modalOtherInputButtonDisabled]}
                    onPress={() => {
                      if (otherTypeText.trim() && selectedCondition) {
                        onAdd(selectedCondition, otherTypeText.trim());
                        setShowOtherInput(false);
                        setOtherTypeText('');
                        setSelectedCondition(null);
                      }
                    }}
                    disabled={!otherTypeText.trim()}
                  >
                    <Text style={styles.modalOtherInputButtonTextSubmit}>Add</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
};

export default function HealthInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [isLifeContextFocused, setIsLifeContextFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    mentalHealth: [],
    physicalHealth: [],
    medications: [],
    therapies: [],
    dateOfBirth: '',
    gender: '',
    country: '',
    lifestyle: {
      smoking: '',
      alcohol: '',
      drugs: '',
      physicalActivity: '',
      diet: '',
      sleep: '',
    },
    lifeContext: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }

    // Load existing health info and convert old format to new format
    const convertToNewFormat = (oldData: any[] | undefined): HealthCondition[] => {
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
        notes: item.notes || undefined,
      }));
    };

    if (user?.healthInfo) {
      setHealthInfo({
        mentalHealth: convertToNewFormat(user.healthInfo.mentalHealth || []),
        physicalHealth: convertToNewFormat(user.healthInfo.physicalHealth || []),
        medications: user.healthInfo.medications || [],
        therapies: user.healthInfo.therapies || [],
        dateOfBirth: (user.healthInfo as any).dateOfBirth || '',
        gender: (user.healthInfo as any).gender || '',
        country: (user.healthInfo as any).country || '',
        lifestyle: {
          smoking: (user.healthInfo as any)?.lifestyle?.smoking || '',
          alcohol: (user.healthInfo as any)?.lifestyle?.alcohol || '',
          drugs: (user.healthInfo as any)?.lifestyle?.drugs || '',
          physicalActivity: (user.healthInfo as any)?.lifestyle?.physicalActivity || '',
          diet: (user.healthInfo as any)?.lifestyle?.diet || '',
          sleep: (user.healthInfo as any)?.lifestyle?.sleep || '',
        },
        lifeContext: (user.healthInfo as any).lifeContext || '',
      });
    } else {
      // Reset to empty if no healthInfo exists
      setHealthInfo({
        mentalHealth: [],
        physicalHealth: [],
        medications: [],
        therapies: [],
        dateOfBirth: '',
        gender: '',
        country: '',
        lifestyle: {
          smoking: '',
          alcohol: '',
          drugs: '',
          physicalActivity: '',
          diet: '',
          sleep: '',
        },
        lifeContext: '',
      });
    }
    setIsLoading(false);
  }, [isAuthenticated, user, router]);

  // Zorg dat Life Context automatisch boven het toetsenbord zichtbaar wordt
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
      if (isLifeContextFocused) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    });

    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isLifeContextFocused]);

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
        [category]: [...current, { condition, type, severity: 'moderate' as SeverityLevel, notes: undefined }],
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

  const handleUpdateNotes = (category: 'mentalHealth' | 'physicalHealth', condition: string, type: string | undefined, notes: string) => {
    setHealthInfo((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.map((item) =>
          item.condition === condition && item.type === type
            ? { ...item, notes }
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

  const [showMedicationOtherInput, setShowMedicationOtherInput] = useState(false);
  const [medicationOtherText, setMedicationOtherText] = useState('');
  const [showTherapyOtherInput, setShowTherapyOtherInput] = useState(false);
  const [therapyOtherText, setTherapyOtherText] = useState('');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const selectedCountry = healthInfo.country
    ? COUNTRIES.find((c) => c.code === healthInfo.country) || null
    : null;

  const filteredCountries = COUNTRIES.filter((country) => {
    if (!countrySearch.trim()) return true;
    const term = countrySearch.toLowerCase();
    return (
      country.name.toLowerCase().includes(term) ||
      country.code.toLowerCase().includes(term)
    );
  });

  const handleAddSimple = (category: 'medications' | 'therapies', item: string) => {
    if (item === 'Other') {
      if (category === 'medications') {
        setShowMedicationOtherInput(true);
        setMedicationOtherText('');
      } else {
        setShowTherapyOtherInput(true);
        setTherapyOtherText('');
      }
      return;
    }

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

  const handleAddOtherMedication = () => {
    if (medicationOtherText.trim()) {
      setHealthInfo((prev) => {
        const current = prev.medications || [];
        return {
          ...prev,
          medications: [...current, medicationOtherText.trim()],
        };
      });
      setShowMedicationOtherInput(false);
      setMedicationOtherText('');
    }
  };

  const handleAddOtherTherapy = () => {
    if (therapyOtherText.trim()) {
      setHealthInfo((prev) => {
        const current = prev.therapies || [];
        return {
          ...prev,
          therapies: [...current, therapyOtherText.trim()],
        };
      });
      setShowTherapyOtherInput(false);
      setTherapyOtherText('');
    }
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
        Alert.alert('Error', response.message || 'Could not update health information');
      }
    } catch (error: any) {
      console.error('Error updating health info:', error);
      Alert.alert('Error', 'Something went wrong while updating your health information');
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
        <Text style={styles.headerTitle}>Health Information</Text>
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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (isLifeContextFocused) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }}
      >
        {/* AI Information Banner */}
        <View style={styles.aiInfoBanner}>
          <View style={styles.aiInfoBannerIcon}>
            <Ionicons name="information-circle" size={20} color={COLORS.info} />
          </View>
          <View style={styles.aiInfoBannerContent}>
            <Text style={styles.aiInfoBannerTitle}>AI Analysis</Text>
            <Text style={styles.aiInfoBannerText}>
              The information you provide here will be used by our AI to personalize your experience, provide better insights, and improve the accuracy of health-related analyses and recommendations.
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          Share information about your mental and physical health. Select a condition and choose the severity with the buttons below.
        </Text>

        {/* Basic Information */}
        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Ionicons name="person-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.categoryHeaderText}>
              <Text style={styles.categoryTitle}>Basic Information</Text>
              <Text style={styles.categorySubtitle}>
                Compact basic details that help put your health in context.
              </Text>
            </View>
          </View>

          {/* Date of birth + Gender in one compact row */}
          <View style={styles.basicInfoRow}>
            <View style={styles.basicInfoField}>
              <Text style={styles.basicInfoLabel}>Date of birth</Text>
              <Pressable
                style={styles.dateField}
                onPress={() => {
                  // Initialize temporary selection from existing value or today
                  let baseDate = new Date();
                  if (healthInfo.dateOfBirth) {
                    const [dd, mm, yyyy] = healthInfo.dateOfBirth
                      .split('-')
                      .map((p) => parseInt(p, 10));
                    if (dd && mm && yyyy) {
                      baseDate = new Date(yyyy, mm - 1, dd);
                    }
                  }
                  setSelectedDay(baseDate.getDate());
                  const monthStr = String(baseDate.getMonth() + 1).padStart(2, '0');
                  setSelectedMonth(monthStr);
                  setSelectedYear(baseDate.getFullYear());
                  setShowDatePicker(true);
                }}
              >
                <Text
                  style={
                    healthInfo.dateOfBirth
                      ? styles.dateFieldText
                      : styles.dateFieldPlaceholder
                  }
                >
                  {healthInfo.dateOfBirth || 'Select date'}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COLORS.textSecondary}
                  style={styles.dateFieldIcon}
                />
              </Pressable>
            </View>

            <View style={styles.basicInfoField}>
              <Text style={styles.basicInfoLabel}>Gender</Text>
              <View style={styles.genderChipsRow}>
                {['Woman', 'Man', 'Non-binary', 'Prefer not to say'].map((option) => {
                  const isSelected = healthInfo.gender === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() =>
                        setHealthInfo((prev) => ({
                          ...prev,
                          gender: option,
                        }))
                      }
                      style={[
                        styles.genderChip,
                        isSelected && styles.genderChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          isSelected && styles.genderChipTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Country */}
          <View style={styles.countrySection}>
            <Text style={styles.basicInfoLabel}>Country</Text>
            <Pressable
              style={styles.countryField}
              onPress={() => setIsCountryPickerOpen(true)}
            >
              {selectedCountry ? (
                <View style={styles.countryFieldContent}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryName}>{selectedCountry.name}</Text>
                </View>
              ) : (
                <Text style={styles.countryPlaceholder}>Select country</Text>
              )}
              <Ionicons
                name={isCountryPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textSecondary}
              />
            </Pressable>
          </View>

          {/* Lifestyle – compact stacked fields */}
          <View style={styles.lifestyleSection}>
            <Text style={styles.lifestyleTitle}>Lifestyle</Text>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>Do you smoke? If yes, how much and since when?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.smoking || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      smoking: text,
                    },
                  }))
                }
                placeholder="e.g. 5 cigarettes per day since 2018"
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>Do you drink alcohol? If yes, how much per week?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.alcohol || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      alcohol: text,
                    },
                  }))
                }
                placeholder="e.g. 3–4 glasses per week"
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>Do you use drugs? If yes, which and how often?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.drugs || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      drugs: text,
                    },
                  }))
                }
                placeholder="e.g. occasionally cannabis on weekends"
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>How often do you exercise per week?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.physicalActivity || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      physicalActivity: text,
                    },
                  }))
                }
                placeholder="e.g. 3x per week gym, daily walks"
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>How would you describe your diet?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.diet || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      diet: text,
                    },
                  }))
                }
                placeholder="e.g. varied, a lot of fast food, vegetarian, etc."
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>

            <View style={styles.lifestyleField}>
              <Text style={styles.lifestyleLabel}>How do you usually sleep (hours per night, quality)?</Text>
              <GlassInput
                value={healthInfo.lifestyle?.sleep || ''}
                onChangeText={(text) =>
                  setHealthInfo((prev) => ({
                    ...prev,
                    lifestyle: {
                      ...(prev.lifestyle || {}),
                      sleep: text,
                    },
                  }))
                }
                placeholder="e.g. 7 hours, often restless / good deep sleep"
                multiline
                showCharCount={false}
                inputStyle={styles.compactMultilineInputText}
              />
            </View>
          </View>
        </GlassCard>

        {/* Country picker modal */}
        <Modal
          visible={isCountryPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsCountryPickerOpen(false)}
        >
          <Pressable
            style={styles.countryModalOverlay}
            onPress={() => setIsCountryPickerOpen(false)}
          >
            <Pressable
              style={styles.countryModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select your country</Text>
                <Pressable onPress={() => setIsCountryPickerOpen(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </Pressable>
              </View>

              <View style={styles.countrySearchContainer}>
                <GlassInput
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Search country"
                  icon="search-outline"
                />
              </View>

              <ScrollView style={styles.countryScroll}>
                {filteredCountries.map((country) => (
                  <Pressable
                    key={country.code}
                    style={[
                      styles.countryItem,
                      country.code === healthInfo.country && styles.countryItemActive,
                    ]}
                    onPress={() => {
                      setHealthInfo((prev) => ({
                        ...prev,
                        country: country.code,
                      }));
                      setIsCountryPickerOpen(false);
                    }}
                  >
                    <Text style={styles.countryItemFlag}>{country.flag}</Text>
                    <Text style={styles.countryItemName}>{country.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Date picker UI when opened */}
        {showDatePicker && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.customDateModalOverlay}>
              <View style={styles.customDateModalContent}>
                <Text style={styles.customDateTitle}>Select date of birth</Text>
                <View style={styles.customDateRow}>
                  {/* Day column */}
                  <View style={styles.customDateColumn}>
                    <Text style={styles.customDateColumnLabel}>Day</Text>
                    <ScrollView
                      style={styles.customDateScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {DAYS.map((d) => (
                        <Pressable
                          key={d}
                          style={[
                            styles.customDateItem,
                            selectedDay === d && styles.customDateItemSelected,
                          ]}
                          onPress={() => setSelectedDay(d)}
                        >
                          <Text
                            style={[
                              styles.customDateItemText,
                              selectedDay === d && styles.customDateItemTextSelected,
                            ]}
                          >
                            {String(d).padStart(2, '0')}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Month column */}
                  <View style={styles.customDateColumn}>
                    <Text style={styles.customDateColumnLabel}>Month</Text>
                    <ScrollView
                      style={styles.customDateScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {MONTHS.map((m) => (
                        <Pressable
                          key={m}
                          style={[
                            styles.customDateItem,
                            selectedMonth === m && styles.customDateItemSelected,
                          ]}
                          onPress={() => setSelectedMonth(m)}
                        >
                          <Text
                            style={[
                              styles.customDateItemText,
                              selectedMonth === m && styles.customDateItemTextSelected,
                            ]}
                          >
                            {m}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Year column */}
                  <View style={styles.customDateColumn}>
                    <Text style={styles.customDateColumnLabel}>Year</Text>
                    <ScrollView
                      style={styles.customDateScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {YEARS.map((y) => (
                        <Pressable
                          key={y}
                          style={[
                            styles.customDateItem,
                            selectedYear === y && styles.customDateItemSelected,
                          ]}
                          onPress={() => setSelectedYear(y)}
                        >
                          <Text
                            style={[
                              styles.customDateItemText,
                              selectedYear === y && styles.customDateItemTextSelected,
                            ]}
                          >
                            {y}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.customDateActions}>
                  <GlassButton
                    title="Cancel"
                    variant="outline"
                    onPress={() => setShowDatePicker(false)}
                    style={styles.customDateButton}
                  />
                  <GlassButton
                    title="Save"
                    variant="primary"
                    onPress={() => {
                      if (selectedDay && selectedMonth && selectedYear) {
                        const dd = String(selectedDay).padStart(2, '0');
                        const mm = selectedMonth;
                        const yyyy = String(selectedYear);
                        const formatted = `${dd}-${mm}-${yyyy}`;
                        setHealthInfo((prev) => ({
                          ...prev,
                          dateOfBirth: formatted,
                        }));
                        setShowDatePicker(false);
                      }
                    }}
                    style={styles.customDateButton}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {showDatePicker && Platform.OS !== 'ios' && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              mode="date"
              display="calendar"
              value={
                healthInfo.dateOfBirth
                  ? (() => {
                      const [dd, mm, yyyy] = healthInfo.dateOfBirth
                        .split('-')
                        .map((p) => parseInt(p, 10));
                      if (!dd || !mm || !yyyy) return new Date(1995, 0, 1);
                      return new Date(yyyy, mm - 1, dd);
                    })()
                  : new Date(1995, 0, 1)
              }
              maximumDate={new Date()}
              onChange={(_event, date) => {
                if (date) {
                  const dd = String(date.getDate()).padStart(2, '0');
                  const mm = String(date.getMonth() + 1).padStart(2, '0');
                  const yyyy = String(date.getFullYear());
                  const formatted = `${dd}-${mm}-${yyyy}`;
                  setHealthInfo((prev) => ({
                    ...prev,
                    dateOfBirth: formatted,
                  }));
                  setShowDatePicker(false);
                }
              }}
            />
          </View>
        )}

        <CategorySection
          title="Mental Health"
          icon="heart-outline"
          conditions={MENTAL_HEALTH_CONDITIONS}
          selected={healthInfo.mentalHealth || []}
          onAdd={(condition, type) => handleAddCondition('mentalHealth', condition, type)}
          onUpdate={(condition, type, severity) => handleUpdateSeverity('mentalHealth', condition, type, severity)}
          onUpdateType={(condition, oldType, newType) => handleUpdateType('mentalHealth', condition, oldType, newType)}
          onUpdateNotes={(condition, type, notes) => handleUpdateNotes('mentalHealth', condition, type, notes)}
          onRemove={(condition, type) => handleRemoveCondition('mentalHealth', condition, type)}
          color={COLORS.error}
        />

        <CategorySection
          title="Physical Health"
          icon="body-outline"
          conditions={PHYSICAL_HEALTH_CONDITIONS}
          selected={healthInfo.physicalHealth || []}
          onAdd={(condition, type) => handleAddCondition('physicalHealth', condition, type)}
          onUpdate={(condition, type, severity) => handleUpdateSeverity('physicalHealth', condition, type, severity)}
          onUpdateType={(condition, oldType, newType) => handleUpdateType('physicalHealth', condition, oldType, newType)}
          onUpdateNotes={(condition, type, notes) => handleUpdateNotes('physicalHealth', condition, type, notes)}
          onRemove={(condition, type) => handleRemoveCondition('physicalHealth', condition, type)}
          color={COLORS.warning}
        />

        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.info}20` }]}>
              <Ionicons name="medical-outline" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.categoryTitle}>Medications</Text>
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
                <Ionicons 
                  name={option === 'Other' ? "create-outline" : "add-circle-outline"} 
                  size={18} 
                  color={COLORS.info} 
                  style={styles.addIcon} 
                />
              </Pressable>
            ))}
          </View>

          {/* Medication Other Input */}
          {showMedicationOtherInput && (
            <View style={styles.otherInputContainer}>
              <GlassInput
                value={medicationOtherText}
                onChangeText={setMedicationOtherText}
                placeholder="Enter medication name..."
                style={styles.otherInput}
              />
              <View style={styles.otherInputActions}>
                <Pressable
                  style={[styles.otherInputButton, styles.otherInputButtonCancel]}
                  onPress={() => {
                    setShowMedicationOtherInput(false);
                    setMedicationOtherText('');
                  }}
                >
                  <Text style={styles.otherInputButtonTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.otherInputButton, styles.otherInputButtonSubmit, !medicationOtherText.trim() && styles.otherInputButtonDisabled]}
                  onPress={handleAddOtherMedication}
                  disabled={!medicationOtherText.trim()}
                >
                  <Text style={styles.otherInputButtonTextSubmit}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.success}20` }]}>
              <Ionicons name="fitness-outline" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.categoryTitle}>Therapies</Text>
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
                <Ionicons 
                  name={option === 'Other' ? "create-outline" : "add-circle-outline"} 
                  size={18} 
                  color={COLORS.success} 
                  style={styles.addIcon} 
                />
              </Pressable>
            ))}
          </View>

          {/* Therapy Other Input */}
          {showTherapyOtherInput && (
            <View style={styles.otherInputContainer}>
              <GlassInput
                value={therapyOtherText}
                onChangeText={setTherapyOtherText}
                placeholder="Enter therapy type..."
                style={styles.otherInput}
              />
              <View style={styles.otherInputActions}>
                <Pressable
                  style={[styles.otherInputButton, styles.otherInputButtonCancel]}
                  onPress={() => {
                    setShowTherapyOtherInput(false);
                    setTherapyOtherText('');
                  }}
                >
                  <Text style={styles.otherInputButtonTextCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.otherInputButton, styles.otherInputButtonSubmit, !therapyOtherText.trim() && styles.otherInputButtonDisabled]}
                  onPress={handleAddOtherTherapy}
                  disabled={!therapyOtherText.trim()}
                >
                  <Text style={styles.otherInputButtonTextSubmit}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Life Context Section */}
        <GlassCard style={styles.categoryCard} padding="lg">
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${COLORS.primary}20` }]}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.categoryHeaderText}>
              <Text style={styles.categoryTitle}>Life Context</Text>
              <Text style={styles.categorySubtitle}>
                Share general information about your life, circumstances, or anything else that might help the AI understand you better
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.lifeContextInput}
            value={healthInfo.lifeContext || ''}
            onChangeText={(text) => setHealthInfo((prev) => ({ ...prev, lifeContext: text }))}
            onFocus={() => setIsLifeContextFocused(true)}
            onBlur={() => setIsLifeContextFocused(false)}
            placeholder="Tell us about your life, current circumstances, relationships, work, hobbies, or anything else that might be relevant for the AI to better understand and support you..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        </GlassCard>

      {/* Extra ruimte wanneer toetsenbord open is zodat Life Context echt boven het toetsenbord kan komen */}
      {isLifeContextFocused && isKeyboardVisible && (
        <View style={{ height: 260 }} />
      )}

        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
          <Text style={styles.privacyNoteText}>
            This information is private and will only be shared with people you trust.
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
    paddingBottom: SPACING.xxl * 2,
  },
  aiInfoBanner: {
    flexDirection: 'row',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: `${COLORS.info}15`,
    borderWidth: 1,
    borderColor: `${COLORS.info}40`,
    gap: SPACING.sm,
  },
  aiInfoBannerIcon: {
    marginTop: 2,
  },
  aiInfoBannerContent: {
    flex: 1,
  },
  aiInfoBannerTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.info,
    fontWeight: '600',
    marginBottom: SPACING.xs / 2,
  },
  aiInfoBannerText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    lineHeight: 18,
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
  basicInfoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  basicInfoField: {
    flex: 1,
  },
  basicInfoLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  countrySection: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  countryField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  countryFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryFlag: {
    fontSize: 18,
    marginRight: SPACING.xs,
  },
  countryName: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  countryPlaceholder: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
  },
  genderChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  genderChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  genderChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderChipText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
  },
  genderChipTextSelected: {
    color: COLORS.white,
  },
  lifestyleSection: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  lifestyleTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lifestyleField: {
    gap: SPACING.xs / 2,
  },
  lifestyleLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  compactInputText: {
    fontSize: 14,
  },
  compactMultilineInputText: {
    fontSize: 14,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 48,
  },
  dateFieldText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  dateFieldPlaceholder: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.textMuted,
  },
  dateFieldIcon: {
    marginLeft: SPACING.sm,
  },
  customDateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  customDateModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  countryModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    maxHeight: '80%',
  },
  customDateTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  customDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  customDateColumn: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  customDateColumnLabel: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  customDateScroll: {
    maxHeight: 200,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    backgroundColor: COLORS.glass.backgroundDark,
  },
  countrySearchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  customDateItem: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  customDateItemSelected: {
    backgroundColor: COLORS.primary + '22',
  },
  customDateItemText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  customDateItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  countryScroll: {
    maxHeight: 400,
  },
  customDateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  customDateButton: {
    minWidth: 100,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glass.border,
  },
  countryItemActive: {
    backgroundColor: COLORS.glass.background,
  },
  countryItemFlag: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  countryItemName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  datePickerContainer: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    paddingVertical: Platform.OS === 'ios' ? SPACING.md : 0,
    paddingHorizontal: Platform.OS === 'ios' ? SPACING.md : 0,
  },
  datePickerDoneButton: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
  },
  otherInputContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  otherInput: {
    marginBottom: SPACING.md,
  },
  otherInputActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  otherInputButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
  },
  otherInputButtonCancel: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  otherInputButtonSubmit: {
    backgroundColor: COLORS.primary,
  },
  otherInputButtonDisabled: {
    opacity: 0.5,
  },
  otherInputButtonTextCancel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  otherInputButtonTextSubmit: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
    fontWeight: '600',
  },
  modalOtherInputContainer: {
    padding: SPACING.md,
  },
  modalOtherInput: {
    marginBottom: SPACING.md,
  },
  modalOtherInputActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  modalOtherInputButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
  },
  modalOtherInputButtonCancel: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  modalOtherInputButtonSubmit: {
    backgroundColor: COLORS.primary,
  },
  modalOtherInputButtonDisabled: {
    opacity: 0.5,
  },
  modalOtherInputButtonTextCancel: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
  },
  modalOtherInputButtonTextSubmit: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.white,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: SPACING.sm,
  },
  notesToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.xs / 2,
  },
  notesToggleText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
  },
  notesInputContainer: {
    marginTop: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  notesInput: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    minHeight: 80,
    maxHeight: 150,
  },
  notesInputActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  notesInputButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  notesInputButtonCancel: {
    backgroundColor: COLORS.glass.background,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  notesInputButtonSave: {
    backgroundColor: COLORS.primary,
  },
  notesInputButtonTextCancel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  notesInputButtonTextSave: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '600',
  },
  notesPreview: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
    padding: SPACING.xs,
    backgroundColor: COLORS.glass.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryHeaderText: {
    flex: 1,
  },
  categorySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs / 2,
    lineHeight: 16,
  },
  lifeContextInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.glass.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.glass.border,
    minHeight: 120,
    maxHeight: 200,
    marginTop: SPACING.md,
  },
});
