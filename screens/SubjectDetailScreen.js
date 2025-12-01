import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform,
  PermissionsAndroid
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import ScheduleService from '../services/ScheduleService';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import Header from '../components/Header';
import Section from '../components/Section';
import SaveButton from '../components/Button';
import { ScreenStyles } from '../styles/ScreenStyles';

const SubjectDetailScreen = ({ route, navigation }) => {
  const { subjectId, subjectName } = route.params;
  const [subject, setSubject] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSubjectData();
  }, [subjectId]);

  const loadSubjectData = async () => {
    try {
      setIsLoading(true);
      
      const subjectData = await ScheduleService.getSubjectById(subjectId);
      setSubject(subjectData);
      
      const allLessons = await ScheduleService.getAllLessons();
      const subjectLessons = allLessons.filter(lesson => lesson.subjectId === subjectId);
      setLessons(subjectLessons);
      
    } catch (error) {
      console.error('Error loading subject data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные предмета');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddGroup = () => {
    Alert.alert('Информация', 'Функция добавления группы будет реализована позже');
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') {
      return true; 
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Разрешение на запись файлов',
          message: 'Приложению нужно разрешение для сохранения файлов Excel',
          buttonNeutral: 'Спросить позже',
          buttonNegative: 'Отмена',
          buttonPositive: 'Разрешить',
        }
      );
      
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Ошибка запроса разрешения:', err);
      return false;
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const exportData = await ScheduleService.getAttendanceExportData(subjectId);
      
      if (!exportData || exportData.length === 0) {
        Alert.alert('Информация', 'Нет данных для экспорта');
        return;
      }

      const wb = XLSX.utils.book_new();

      const groupedData = {};
      exportData.forEach(item => {
        const groupName = item.groupName || 'Без группы';
        if (!groupedData[groupName]) {
          groupedData[groupName] = [];
        }
        groupedData[groupName].push(item);
      });

      Object.keys(groupedData).forEach(groupName => {
        const groupData = groupedData[groupName];
        
        const uniqueDates = [...new Set(groupData.map(item => item.lessonDate))].filter(date => date).sort();
        const uniqueStudents = [...new Set(groupData.map(item => item.studentName))].filter(name => name).sort();
        
        const excelData = [];
        
        excelData.push([`Группа: ${groupName}`]);
        excelData.push([]); 
        
        const headers = ['ФИО', ...uniqueDates];
        excelData.push(headers);
        
        uniqueStudents.forEach(studentName => {
          const row = [studentName];
          
          uniqueDates.forEach(date => {
            const attendanceRecord = groupData.find(
              item => item.studentName === studentName && item.lessonDate === date
            );
            const status = attendanceRecord?.attendanceStatus === 'present' ? '+' : 
                          attendanceRecord?.attendanceStatus === 'absent' ? 'н' : '';
            row.push(status);
          });
          
          excelData.push(row);
        });
        
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        const colWidths = [
          { wch: 30 },
          ...uniqueDates.map(() => ({ wch: 8 }))
        ];
        ws['!cols'] = colWidths;

        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ 
          s: { r: 0, c: 0 }, 
          e: { r: 0, c: headers.length - 1 } 
        });

        const sheetName = groupName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const wbout = XLSX.write(wb, { 
        type: 'base64', 
        bookType: 'xlsx' 
      });
      
      const fileName = `Посещаемость_${subjectName.replace(/\s+/g, '_')}.xlsx`;
      const fileUri = `${FileSystemLegacy.documentDirectory}${fileName}`;
      
      console.log('Создаем файл по пути:', fileUri);

      await FileSystemLegacy.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystemLegacy.EncodingType.Base64
      });
      
      console.log('Файл успешно создан');

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Сохранить посещаемость: ${subjectName}`
        });
      } else {
        Alert.alert('Успех', 'Файл готов к сохранению');
      }

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    } finally {
      setIsExporting(false);
    }
  };

  const getDayName = (dayNumber) => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return days[dayNumber - 1] || 'Неизвестно';
  };

  const getWeekTypeText = (weekType) => {
    switch (weekType) {
      case 'numerator': return 'Числитель';
      case 'denominator': return 'Знаменатель';
      case 'both': return 'Каждую неделю';
      default: return 'Неизвестно';
    }
  };

  const groupedLessons = lessons.reduce((acc, lesson) => {
    const day = lesson.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(lesson);
    return acc;
  }, {});

  const uniqueGroups = [...new Set(lessons.map(lesson => lesson.group_name))].filter(Boolean);

  if (isLoading) {
    return (
      <View style={ScreenStyles.subjectDetailScreenContainer}>
        <Header
          title="Загрузка..."
          onBack={handleBack}
          onLogout={handleLogout}
          headerStyle={ScreenStyles.scheduleManagementScreenHeader}
        />
        <View style={ScreenStyles.subjectDetailScreenLoadingContainer}>
          <Text style={ScreenStyles.subjectDetailScreenLoadingText}>Загрузка данных предмета...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ScreenStyles.subjectDetailScreenContainer}>
      <Header
        title={subjectName}
        onBack={handleBack}
        onLogout={handleLogout}
      />

      <ScrollView style={ScreenStyles.subjectDetailScreenScrollView} showsVerticalScrollIndicator={false}>
        
        {/* Информация о группах */}
        <Section>
          <View style={ScreenStyles.subjectDetailScreenSectionHeader}>
            <Text style={ScreenStyles.subjectDetailScreenSectionTitle}>Группы</Text>
            <TouchableOpacity 
              style={ScreenStyles.subjectDetailScreenRefreshButton}
              onPress={loadSubjectData}
            >
              <Text style={ScreenStyles.subjectDetailScreenRefreshButtonText}>⟳</Text>
            </TouchableOpacity>
          </View>
          
          {uniqueGroups.length > 0 ? (
            <View style={ScreenStyles.subjectDetailScreenGroupsContainer}>
              {uniqueGroups.map((group, index) => (
                <View key={index} style={ScreenStyles.subjectDetailScreenGroupChip}>
                  <Text style={ScreenStyles.subjectDetailScreenGroupChipText}>{group}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={ScreenStyles.subjectDetailScreenEmptyState}>
              <Text style={ScreenStyles.subjectDetailScreenEmptyStateText}>Группы не добавлены</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={ScreenStyles.subjectDetailScreenAddButton}
            onPress={handleAddGroup}
          >
            <Text style={ScreenStyles.subjectDetailScreenAddButtonText}>+ Добавить группу</Text>
          </TouchableOpacity>
        </Section>

        {/* Расписание занятий */}
        <Section title="Расписание занятий">
          {lessons.length > 0 ? (
            <View style={ScreenStyles.subjectDetailScreenScheduleContainer}>
              <SaveButton
                onPress={handleExport}
                text="Выгрузить посещаемость"
                isLoading={isExporting}
                disabled={isExporting}
                style={ScreenStyles.subjectDetailScreenExportButton}
              />
              
              {Object.entries(groupedLessons).map(([day, dayLessons]) => (
                <View key={day} style={ScreenStyles.subjectDetailScreenDaySection}>
                  <Text style={ScreenStyles.subjectDetailScreenDayTitle}>{getDayName(parseInt(day))}</Text>
                  
                  {dayLessons.map((lesson, index) => (
                    <View key={lesson.id || index} style={ScreenStyles.subjectDetailScreenLessonItem}>
                      <View style={ScreenStyles.subjectDetailScreenLessonTime}>
                        <Text style={ScreenStyles.subjectDetailScreenTimeText}>
                          {lesson.startTime} - {lesson.endTime}
                        </Text>
                        <View style={[
                          ScreenStyles.subjectDetailScreenWeekBadge,
                          lesson.weekType === 'numerator' ? ScreenStyles.subjectDetailScreenNumeratorBadge : 
                          lesson.weekType === 'denominator' ? ScreenStyles.subjectDetailScreenDenominatorBadge : 
                          ScreenStyles.subjectDetailScreenBothBadge
                        ]}>
                          <Text style={ScreenStyles.subjectDetailScreenWeekBadgeText}>
                            {getWeekTypeText(lesson.weekType)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={ScreenStyles.subjectDetailScreenLessonDetails}>
                        <Text style={ScreenStyles.subjectDetailScreenGroupText}>Группа: {lesson.group_name}</Text>
                        {lesson.classroom && (
                          <Text style={ScreenStyles.subjectDetailScreenClassroomText}>Аудитория: {lesson.classroom}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <View style={ScreenStyles.subjectDetailScreenEmptyState}>
              <Text style={ScreenStyles.subjectDetailScreenEmptyStateText}>Нет запланированных занятий</Text>
              <Text style={ScreenStyles.subjectDetailScreenEmptyStateSubtext}>
                Добавьте занятия через меню "Управление занятиями"
              </Text>
            </View>
          )}
        </Section>

        {/* Статистика */}
        <Section title="Статистика">
          <View style={ScreenStyles.subjectDetailScreenStatsContainer}>
            <View style={ScreenStyles.subjectDetailScreenStatItem}>
              <Text style={ScreenStyles.subjectDetailScreenStatNumber}>{lessons.length}</Text>
              <Text style={ScreenStyles.subjectDetailScreenStatLabel}>Всего занятий</Text>
            </View>
            <View style={ScreenStyles.subjectDetailScreenStatItem}>
              <Text style={ScreenStyles.subjectDetailScreenStatNumber}>{uniqueGroups.length}</Text>
              <Text style={ScreenStyles.subjectDetailScreenStatLabel}>Групп</Text>
            </View>
            <View style={ScreenStyles.subjectDetailScreenStatItem}>
              <Text style={ScreenStyles.subjectDetailScreenStatNumber}>
                {Object.keys(groupedLessons).length}
              </Text>
              <Text style={ScreenStyles.subjectDetailScreenStatLabel}>Дней в неделю</Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
};

export default SubjectDetailScreen;