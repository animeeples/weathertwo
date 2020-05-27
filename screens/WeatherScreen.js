import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  TouchableWithoutFeedback,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  FlatList,
  AsyncStorage,
} from 'react-native';
import _ from 'lodash';
import moment from 'moment';
import { Input } from 'react-native-elements';

import { KEYS } from '../keys.js'
const { OPEN_WEATHER_API_KEY } = KEYS;

// const cityData = require('../data/cityDataShort.json');
const cityData = require('../data/current.city.list.json');
const northAmericanData = _.filter(cityData, function(city) {
  return city.country === 'US' || city.country === 'CA';
});
const uniqueCityData = _.uniqBy(northAmericanData, 'name');

const sun = require('../assets/sun.png');
const atmosphere = require('../assets/atmosphere.png');
const drizzle = require('../assets/drizzle.png');
const clouds = require('../assets/clouds.png');
const moon = require('../assets/moon.png');
const rain = require('../assets/rain.png');
const snow = require('../assets/snow2.png');
const thunderstorm = require('../assets/thunderstorm.png');

const styles = StyleSheet.create({
  loadingSAV: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: 'normal',
    fontSize: 30,
  },
  infoContainer: {
    marginTop: 8,
    paddingLeft: 8,
    paddingRight: 8,
  },
  infoText: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'normal',
    fontSize: 14,
  },
  cityText: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: 'normal',
    fontSize: 28,
  },
  temperature: {
    marginTop: 32,
  },
  temperatureView: {
    paddingLeft: 8,
    paddingRight: 8,
  },
  temperatureText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontWeight: 'normal',
    fontSize: 48,
  },
  dismissText: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: 'normal',
    fontSize: 28,
    margin: 8,
  },
  locationModal: {
    flex: 1,
    backgroundColor: '#e6daca',
  },
  inputContainer: {
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  input: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'normal',
    fontSize: 14,
  },
  item: {
    margin: 8,
    marginBottom: 16,
  },
  itemText: {
    fontFamily: 'Poppins_600SemiBold',
    fontWeight: 'normal',
    fontSize: 14,
  },
  imageContainer: {
    flex: 1,
    paddingLeft: 8,
  },
});

class WeatherScreen extends Component {
  state = {
    isCheckingAsyncStorage: true,
    isLoading: true,
    city: '',
    temperature: 0,
    weatherCondition: 'Sunny',
    locationModalVisible: false,
    locationInput: '',
    lat: null,
    lon: null,
    date: null,
    celsius: true,
    refreshing: false,
  }

  _retrieveData = async () => {
    try {
      const infoData = await AsyncStorage.getItem('info');
      await this.setState({ isCheckingAsyncStorage: false });
      const info = JSON.parse(infoData);
      let lat = 37.779160;
      let lon = -122.415810;
      if (info !== null) {
        // We have data!!
        lat = info.lat;
        lon = info.lon;
        await this.setState({ celsius: info.celsius });
      }
      return this.fetchWeather(lat, lon);
    } catch (error) {
      // Error retrieving data
    }
  };

  wait(timeout) {
    return new Promise(resolve => {
      setTimeout(resolve, timeout);
    });
  }

  onRefresh = () => {
    this.setState({ refreshing: true });
    const { date } = this.state;
    const currentTime = Date.now();
    // Check if the last update was < 10 minutes ago
    if (date) {
      const delta = currentTime / 1000 - date;
      if (delta < 600) {
        this.wait(1000).then(() => this.setState({ refreshing: false }));
        return;
      }
    }
    const { lat, lon } = this.state;
    this.fetchWeather(lat, lon);
    this.wait(1000).then(() => this.setState({ refreshing: false }));
  }

  componentDidMount() {
    this._retrieveData();
  }

  setLocationModalVisible(visible) {
    this.setState({ locationModalVisible: visible });
  }

  async setPrimaryScale() {
    await this.setState(prevState => ({
      celsius: !prevState.celsius,
    }));
    const { city, lat, lon, date, celsius } = this.state;
    const info = { city, lat, lon, date, celsius };
    AsyncStorage.setItem(
      'info',
      JSON.stringify(info)
    )
  }

  fetchWeather(lat, lon) {
    fetch(
      `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&APPID=${OPEN_WEATHER_API_KEY}&units=metric`
    )
    .then(res => res.json())
    .then(json => {
      this.setState({
        city: json.name,
        temperature: json.main.temp,
        weatherCondition: json.weather[0].main,
        isLoading: false,
        lat,
        lon,
        date: json.dt,
      }, () => {
        const { city, lat, lon, date, celsius } = this.state;
        const info = { city, lat, lon, date, celsius };
        AsyncStorage.setItem(
          'info',
          JSON.stringify(info)
        )
      });
    });
  }

  renderItem({ item }) {
    return (
      <View style={styles.item}>
        <TouchableWithoutFeedback
          onPress={() => this.setState({
            lat: item.coord.lat,
            lon: item.coord.lon,
            isLoading: true,
            locationModalVisible: false,
          }, () => {
            const { lat, lon } = this.state;
            this.fetchWeather(lat, lon);
          })}
        >
          <Text style={styles.itemText}>{item.name}</Text>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  render() {
    const {
      isCheckingAsyncStorage,
      isLoading,
      city,
      temperature,
      weatherCondition,
      locationModalVisible,
      locationInput,
      lat,
      lon,
      date,
      celsius,
      refreshing,
    } = this.state;
    if (isLoading || isCheckingAsyncStorage) {
      return (
        <SafeAreaView style={styles.loadingSAV}>
          <Text style={styles.text}>Loading</Text>
        </SafeAreaView>
      )
    }

    const day = moment.unix(date);

    const dayTime = new Date().getHours();

    const filteredCityData = _.sortBy(_.filter(uniqueCityData, function(item) {
      return item.name.toLocaleLowerCase().indexOf(locationInput.toLocaleLowerCase()) > -1;
    }), ['name']);

    let weatherConditionImage = sun;
    switch(weatherCondition.toLowerCase()) {
      case 'clear':
        if (dayTime > 20 || dayTime < 6) {
          weatherConditionImage = moon;
          break;
        }
        weatherConditionImage = sun;
        break;
      case 'atmosphere':
        weatherConditionImage = atmosphere;
        break;
      case 'clouds':
        weatherConditionImage = clouds;
        break;
      case 'drizzle':
        weatherConditionImage = drizzle;
        break;
      case 'rain':
        weatherConditionImage = rain;
        break;
      case 'snow':
        weatherConditionImage = snow;
        break;
      case 'thunderstorm':
        weatherConditionImage = thunderstorm;
        break;
      default:
        weatherConditionImage = sun;
    }

    return (
      <SafeAreaView>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <Modal
            animationType="slide"
            transparent={false}
            visible={locationModalVisible}
          >
            <SafeAreaView style={styles.locationModal}>
              <TouchableWithoutFeedback
                onPress={() => this.setLocationModalVisible(false)}
              >
                <Text style={styles.dismissText}>dismiss</Text>
              </TouchableWithoutFeedback>
              <Input
                placeholder='San Francisco'
                inputStyle={styles.input}
                inputContainerStyle={styles.inputContainer}
                selectionColor={'black'}
                onChangeText={value => this.setState({ locationInput: value })}
              />
              {locationInput.length > 0 &&
                <FlatList
                  data={filteredCityData}
                  renderItem={({ item }) => this.renderItem({ item })}
                  keyExtractor={item => item.id.toString()}
                  keyboardShouldPersistTaps="handled"
                />
              }
            </SafeAreaView>
          </Modal>
          <TouchableWithoutFeedback
            onPress={() => this.setLocationModalVisible(true)}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>{moment(day).format('dddd')}</Text>
              <Text style={styles.infoText}>{moment(day).format('MMMM D YYYY')}</Text>
              <Text style={styles.cityText}>{city}</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback
            style={styles.temperature}
            onPress={() => this.setPrimaryScale()}
          >
            <View style={styles.temperatureView}>
              {celsius &&
                <Text style={styles.temperatureText}>{Math.round(temperature*10)/10}&deg;C / {Math.round(((temperature * 9 / 5) + 32)*10)/10}&deg;F</Text>
              }
              {!celsius &&
                <Text style={styles.temperatureText}>{Math.round(((temperature * 9 / 5) + 32)*10)/10}&deg;F / {Math.round(temperature*10)/10}&deg;C</Text>
              }
              <Text style={styles.infoText}>{weatherCondition}</Text>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.imageContainer}>
            <Image
              source={weatherConditionImage}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

export default WeatherScreen;
