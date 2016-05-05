'use strict';
import React, {
  StyleSheet,
  Text,
  View,
  Animated,
  Easing,
  TouchableOpacity
} from 'react-native';

const ANIMATED_EASING_PREFIXES = ['easeInOut', 'easeOut', 'easeIn'];

const ALMOST_ZERO = 0.00000001;
export class Collapsible extends React.Component {
  static propTypes = {
    align: React.PropTypes.oneOf(['top', 'center', 'bottom']),
    collapsed: React.PropTypes.bool,
    duration: React.PropTypes.number,
    easing: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func
    ]),
  }

  static defaultProps = {
    align: 'top',
    collapsed: true,
    duration: 300,
    easing: 'easeOutCubic',
  }
  state = {
    height: new Animated.Value(ALMOST_ZERO),
    contentHeight: 0,
    animating: false,
  }
  componentWillReceiveProps(props) {
    if(props.collapsed !== this.props.collapsed) {
      this._toggleCollapsed(props.collapsed);
    }
  }
  _toggleCollapsed(collapsed)  {
    var height : number = collapsed ? ALMOST_ZERO : this.state.contentHeight;
    var { easing, duration } = this.props;

    if(typeof easing === 'string') {
      var prefix, found = false;
      for (var i = 0; i < ANIMATED_EASING_PREFIXES.length; i++) {
        prefix = ANIMATED_EASING_PREFIXES[i];
        if(easing.substr(0, prefix.length) === prefix) {
          easing = easing.substr(prefix.length, 1).toLowerCase() + easing.substr(prefix.length + 1);
          prefix = prefix.substr(4, 1).toLowerCase() + prefix.substr(5);
          easing = Easing[prefix](Easing[easing || 'ease']);
          found = true;
          break;
        }
      };
      if(!found) {
        easing = Easing[easing];
      }
      if(!easing) {
        throw new Error('Invalid easing type "' + this.props.easing + '"');
      }
    }

    if(this._animation) {
      this._animation.stop();
    }
    this.setState({ animating: true });
    this._animation = Animated.timing(this.state.height, {
      toValue: height,
      duration,
      easing,
    }).start(event => this.setState({ animating: false }));
  }
   _handleLayoutChange(event) {
    var contentHeight = event.nativeEvent.layout.height;
    var height = this.props.collapsed ? ALMOST_ZERO : contentHeight
    this.setState({
      height: new Animated.Value(height),
      contentHeight,
    });
  }
  render() {
    var { height, contentHeight } = this.state;
    var style = {
      overflow: 'hidden',
      height: height
    };
    var contentStyle = {};
    if(this.props.align === 'center') {
      contentStyle.transform = [{
        translateY: height.interpolate({
          inputRange: [0, contentHeight],
          outputRange: [contentHeight/-2, 0],
        })
      }];
    } else if(this.props.align === 'bottom') {
      contentStyle.transform = [{
        translateY: height.interpolate({
          inputRange: [0, contentHeight],
          outputRange: [-contentHeight, 0],
        })
      }];
    }
    return (
      <Animated.View style={style} pointerEvents={this.props.collapsed ? 'none' : 'auto'}>
        <Animated.View style={contentStyle} onLayout={this.state.animating ? undefined : this._handleLayoutChange.bind(this)}>
          {this.props.children}
        </Animated.View>
      </Animated.View>
    );
  }
}

var COLLAPSIBLE_PROPS = Object.keys(Collapsible.propTypes);
var VIEW_PROPS = Object.keys(View.propTypes);
export class Accordion extends React.Component{
  static propTypes = {
    sections:               React.PropTypes.array.isRequired,
    renderHeader:           React.PropTypes.func.isRequired,
    renderContent:          React.PropTypes.func.isRequired,
    onChange:               React.PropTypes.func,
    align:                  React.PropTypes.oneOf(['top', 'center', 'bottom']),
    duration:               React.PropTypes.number,
    easing:                 React.PropTypes.string,
    initiallyActiveSection: React.PropTypes.number,
    underlayColor:          React.PropTypes.string,
  }

  static defaultProps = {
    underlayColor: 'black',
  }

  state = {
    activeSection: this.props.initiallyActiveSection,
  }

  _toggleSection(section) {
    var activeSection = this.state.activeSection === section ? false : section;
    this.setState({ activeSection });
    if(this.props.onChange) {
      this.props.onChange(activeSection);
    }
  }

  render() {
    var viewProps = {};
    var collapsibleProps = {};
    Object.keys(this.props).forEach((key) => {
      if(COLLAPSIBLE_PROPS.indexOf(key) !== -1) {
        collapsibleProps[key] = this.props[key];
      } else if(VIEW_PROPS.indexOf(key) !== -1) {
        viewProps[key] = this.props[key];
      }
    });

    return (
      <View {...viewProps}>
      {this.props.sections.map((section, key) => (
        <View key={key}>
          <TouchableOpacity onPress={() => this._toggleSection(key)} underlayColor={this.props.underlayColor}>
            {this.props.renderHeader(section, key, this.state.activeSection === key)}
          </TouchableOpacity>
          <Collapsible collapsed={this.state.activeSection !== key} {...collapsibleProps}>
            {this.props.renderContent(section, key, this.state.activeSection === key)}
          </Collapsible>
        </View>
      ))}
      </View>
    );
  }
}
