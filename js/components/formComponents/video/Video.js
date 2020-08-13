/**
 * @flow
 */
import React, { Component } from 'react';
import Video from 'react-native-video';
import {
  Image,
  Text,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  View,
  StyleSheet,
} from 'react-native';
import { Spinner } from 'native-base';
import { transformSeconds } from '../../../utils/util';
import { toastError } from '../../../utils/toast';
import { cacheMedia, caculateProgress, isLocalResource } from './util';
import theme from '../../../tabs/common/theme';

const { width } = Dimensions.get('window');
const AUTO_DISMISS = 2500;
const CACHE_MANUALLY = false;

type Prop = {
  uri: string,
  cacheName: string,
  style: any,
  autoStart: boolean,
  isPortrait: boolean,
};

type State = {
  muted: boolean,
  paused: boolean,
  readyToStart: boolean,
  operatorVisible: boolean,
  indicatorOpacity: number,
  currentTime: number,
  playableDuration: number,
  cachedProgress: number,
  pgWidth: number,
  uri: string,
  isPortrait: boolean,
  totalTime: number,
};

export default class extends Component<Prop, State> {
  static defaultProps = {
    autoStart: false,
    cacheName: 'forceClouds',
    isPortrait: true,
  };

  touchActived = false;
  playImg: any = null;
  pauseImg: any = null;
  initMovedDistance: number = 0;
  _panResponder: any = null;
  video: any = null;
  timer: any = null;

  constructor(props: Object) {
    super(props);

    this.playImg = <Image style={styles.play} source={require('../../../tabs/img/play.png')} />;
    this.pauseImg = <Image style={styles.play} source={require('../../../tabs/img/pause.png')} />;
    this.state = {
      muted: false,
      paused: true,
      readyToStart: false,
      operatorVisible: true,
      indicatorOpacity: 0,
      totalTime: 0,
      currentTime: 0,
      playableDuration: 0,
      cachedProgress: 0,
      pgWidth: 0,
      uri: props.uri,
      isPortrait: props.isPortrait,
    };
  }

  componentWillMount() {
    this.initMovedDistance = 0;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: this._onPanResponderGrant,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderRelease,
    });
  }

  _onPanResponderGrant = (evt, gestureState) => {
    this.touchActived = true;
    this.setState({
      indicatorOpacity: 0.4,
    });
  };

  _onPanResponderMove = (evt, gestureState) => {
    const { pgWidth, totalTime, currentTime } = this.state;
    const offset = gestureState.dx - this.initMovedDistance;
    this.initMovedDistance = gestureState.dx;

    let targetTime = currentTime + (offset / pgWidth) * totalTime;
    if (targetTime > totalTime) {
      targetTime = totalTime;
    } else if (targetTime < 0) {
      targetTime = 0;
    }

    clearTimeout(this.timer);
    this.setState({
      currentTime: targetTime,
    });
  };

  _onPanResponderRelease = (evt, gestureState) => {
    this.initMovedDistance = 0;
    this.video.seek(this.state.currentTime);

    this.setState(
      {
        indicatorOpacity: 0,
      },
      this.autoDismissOperator,
    );

    setTimeout(() => {
      // 延时放开进度的更新，避免过早开放刷新进度导致老进度刷新的闪现问题
      this.touchActived = false;
    }, 100);
  };

  onEnd = () => {
    this.setState(
      {
        paused: true,
        currentTime: 0,
        operatorVisible: true,
      },
      () => {
        this.video.seek(0);
      },
    );
  };

  videoError = (res: Object) => {
    toastError('视频加载异常');
  };

  toggleVideo = () => {
    this.setState(
      {
        paused: !this.state.paused,
      },
      this.autoDismissOperator,
    );
  };

  toggleMute = () => {
    this.setState({
      muted: !this.state.muted,
    });
  };

  toggleVideoOperator = () => {
    const { operatorVisible } = this.state;
    this.setState(
      {
        operatorVisible: !operatorVisible,
      },
      this.autoDismissOperator,
    );
  };

  autoDismissOperator = () => {
    const { operatorVisible, paused } = this.state;

    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (operatorVisible && !paused) {
      this.timer = setTimeout(() => {
        this.setState({
          operatorVisible: false,
        });
      }, AUTO_DISMISS);
    }
  };

  setProgress = ({
    playableDuration,
    seekableDuration,
    currentTime,
  }: {
    playableDuration: number,
    seekableDuration: number,
    currentTime: number,
  }) => {
    if (playableDuration <= seekableDuration) {
      this.setState({ playableDuration });
    }

    if (!this.touchActived) {
      // 调整快进标记.需要注意的是，在未开始的时候，是不会被调用的，如果此时需要调整进度的话，需要给 currentTime 设置初始值
      this.setState({ currentTime });
    }
  };

  onLoad = (res: Object) => {
    const { autoStart } = this.props;
    this.setState(
      {
        readyToStart: true,
        totalTime: res.duration, // 这里的 totalTime 参与进度计算，所以不建议取整运算
      },
      () => {
        if (autoStart) {
          this.toggleVideo();
        }
      },
    );
  };

  cacheFinished = (path: string) =>
    this.setState({ uri: path, cachedProgress: 100, readyToStart: true });

  updateCacheProgress = (progress: number) => this.setState({ cachedProgress: progress });

  componentDidMount() {
    const { uri, cacheName } = this.props;

    if (CACHE_MANUALLY) {
      if (isLocalResource(uri)) {
        this.cacheFinished(uri);
      } else {
        cacheMedia(uri, cacheName, this.updateCacheProgress)
          .then(this.cacheFinished)
          .catch((err) => {
            toastError(err.message);
          });
      }
    }
  }

  render() {
    const {
      uri,
      totalTime,
      currentTime,
      cachedProgress,
      operatorVisible,
      indicatorOpacity,
      pgWidth,
      muted,
      playableDuration,
      isPortrait,
      readyToStart,
    } = this.state;
    const { style } = this.props;

    // 方向相关的样式适配
    const orientationStyle = isPortrait ? styles.portraitContainer : styles.landscapeContainer;
    const orientationProgressWrapper = isPortrait
      ? styles.portraitProgressWrapper
      : styles.landscapeProgressWrapper;
    const progress = caculateProgress(totalTime, currentTime);
    const bufferedProgress = CACHE_MANUALLY
      ? cachedProgress
      : caculateProgress(totalTime, playableDuration);

    return (
      <View style={[styles.container, orientationStyle, style]}>
        {((CACHE_MANUALLY && readyToStart) || !CACHE_MANUALLY) && (
          <Video
            source={{ uri }} // Can be a URL or a local file.
            ref={(ref) => {
              this.video = ref;
            }} // Store reference
            rate={1.0} // 0 is paused, 1 is normal.
            volume={1.0} // 0 is muted, 1 is normal.
            muted={muted} // Mutes the audio entirely.
            paused={this.state.paused} // Pauses playback entirely.
            resizeMode="contain" // Fill the whole screen at aspect ratio.*
            playInBackground={false} // Audio continues to play when app entering background.
            playWhenInactive={false} // [iOS] Video continues to play when control or notification center are shown.
            ignoreSilentSwitch="ignore" // [iOS] ignore | obey - When 'ignore', audio will still play with the iOS hard silent switch set to silent. When 'obey', audio will toggle with the switch. When not specified, will inherit audio settings as usual.
            progressUpdateInterval={250.0} // [iOS] Interval to fire onProgress (default to ~250ms)
            onProgress={this.setProgress}
            // onLoadStart={this.loadStart}            // Callback when video starts to load
            onLoad={this.onLoad} // Callback when video loads
            onEnd={this.onEnd} // Callback when playback finishes
            onError={this.videoError} // Callback when video cannot be loaded
            style={styles.video}
          />
        )}
        {operatorVisible && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={this.toggleVideoOperator}
            style={[styles.videoOperator, styles.absoluteView]}
          >
            {readyToStart && (
              <TouchableOpacity onPress={this.toggleVideo}>
                {this.state.paused ? this.playImg : this.pauseImg}
              </TouchableOpacity>
            )}
            <View style={[styles.progressWrapper, orientationProgressWrapper]}>
              <Text style={styles.progressText}>{transformSeconds(currentTime)}</Text>
              <View style={styles.progressInner}>
                <View
                  style={styles.progressBar}
                  onLayout={(event) => {
                    this.setState({
                      pgWidth: event.nativeEvent.layout.width,
                    });
                  }}
                >
                  <View style={[styles.progressBarBuffered, { width: `${bufferedProgress}%` }]} />
                  <View style={[styles.progressBarPlayed, { width: `${progress}%` }]} />
                </View>
                <View
                  {...this._panResponder.panHandlers}
                  style={[
                    styles.playedProgressBallIndicator,
                    {
                      backgroundColor: `$rgba(255, 255, 255, ${indicatorOpacity})`,
                      left: -10 + progress * 0.01 * pgWidth,
                    },
                  ]}
                >
                  <View style={styles.playedProgressBall} />
                </View>
              </View>
              <Text style={styles.progressText}>{transformSeconds(totalTime)}</Text>
            </View>
          </TouchableOpacity>
        )}
        {!operatorVisible && (
          <TouchableOpacity style={styles.absoluteView} onPress={this.toggleVideoOperator} />
        )}
        {!readyToStart && (
          <View style={[styles.absoluteView, styles.videoOperator]}>
            <Spinner color="white" size="small" />
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  landscapeContainer: {
    width: '100%',
    height: (width * 3) / 4,
  },
  portraitContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  absoluteView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoOperator: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoPreview: {
    position: 'absolute',
    width: '100%',
    height: (width * 3) / 4,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  play: {
    marginTop: 30,
  },
  headerImage: {
    height: 200,
  },
  title: {
    fontSize: 18,
    lineHeight: 25,
    color: '#333',
    fontWeight: '400',
  },
  publishTime: {
    marginTop: 15,
    textAlign: 'left',
    fontWeight: '200',
    fontSize: 12,
    lineHeight: 14,
    color: '#666',
  },
  detail: {
    marginTop: 12,
    backgroundColor: 'white',
    paddingHorizontal: 14.5,
    paddingTop: 14,
    paddingBottom: 18,
  },
  detailText: {
    color: '#777',
    fontSize: 14,
    marginTop: 10.5,
    lineHeight: 24,
    fontWeight: '200',
  },
  action: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  shareOptions: {
    flexDirection: 'row',
    paddingVertical: 20,
    width: 220,
    borderRadius: 4,
    backgroundColor: 'white',
    justifyContent: 'space-around',
    paddingHorizontal: 25,
    alignSelf: 'center',
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIcon: {
    width: 40,
    height: 40,
  },
  shareText: {
    fontSize: 12,
    color: 'black',
    marginTop: 3,
  },
  rightView: {
    flex: 1,
    flexDirection: 'row',
  },
  actionItem: {
    flex: 1,
    justifyContent: 'center',
  },
  progressWrapper: {
    flexDirection: 'row',
    position: 'absolute',
    alignItems: 'center',
    bottom: 0,
    left: 0,
    right: 0,
    height: 35,
  },
  portraitProgressWrapper: {
    bottom: 30,
  },
  landscapeProgressWrapper: {
    bottom: 0,
  },
  progressInner: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressBarPlayed: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    backgroundColor: theme.brand_primary,
    borderRadius: 3,
  },
  progressBarBuffered: {
    height: '100%',
    width: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
  },
  progressHover: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: -6,
    top: 0,
    right: -6,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playedProgressBall: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  playedProgressBallIndicator: {
    position: 'absolute',
    left: -5,
    height: 20,
    width: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    marginHorizontal: 12,
    width: 35,
  },
});
