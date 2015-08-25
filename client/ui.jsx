var Table = Reactable.Table;
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup

var If = React.createClass({
    render: function() {
        if (this.props.test) {
            return this.props.children;
        }
        else {
            return (<span></span>);
        }
    }
});

var CacheEntries = React.createClass({
    render: function() {
        return this.props.data.length ?
        <Table
            sortable={true}
            filterable={['url']}
            columns={[{key: 'url', label: 'URL'},
            {key: 'contenttype', label: 'Content-type'},
            {key: 'used', label: 'Latest use'},
            {key: 'expires', label: 'Expires by'},
            {key: 'hits', label: 'Hits'},
            {key: 'size', label: 'Size'}
            ]}
            className="pure-table pure-table-striped"
            itemsPerPage={100}
            data={this.props.data}
        /> : <p style={{fontStyle: 'italic'}}>Cache is empty</p>;


    }
});

var CacheStats = React.createClass({
    formatBytes: function(bytes,decimals) {
        if(bytes == 0) return '0 Byte';
        var k = 1000;
        var dm = decimals + 1 || 3;
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toPrecision(dm) + ' ' + sizes[i];
    },

    render: function() {
        return (
            <dl>
                <dt>Cache entries</dt>
                <dd>{this.props.data.contents.length}</dd>
                <dt>Cache size</dt>
                <dd>{this.formatBytes(this.props.data.contents.reduce(function (previousValue, currentValue) {
                    return previousValue + currentValue.size;
                    }, 0), 2)}</dd>
                <dt>V8 heap usage</dt>
                <dd>{this.formatBytes(this.props.data.heapUsage, 2)}</dd>
                <dt>Hit ratio</dt>
                <dd>{this.props.data.requests !== 0 ?
                    parseFloat(Math.round( 100*(this.props.data.hits/this.props.data.requests) * 100) / 100).toFixed(2) + "%" :
                    'N/A'}&nbsp;{this.props.data.requests > 1 ? '(of ' + this.props.data.requests  + ' requests)' : undefined }</dd>
            </dl>
        );
    }
});




var Main = React.createClass({

    getInitialState: function() {
        return {
            cache: {heapUsage: 0,
                    contents: []},
            meta: {},
            autoupdating: true,
            statusShowing: true
        };
    },

    componentDidMount: function() {

        this.updateCacheData = this.update.bind(this, this.props.cacheUrl);

        this.update.apply(this, [this.props.metaUrl]);
        this.updateCacheData();

        setInterval(function() {
            if (this.state.autoupdating) {
                this.updateCacheData();
            }
        }.bind(this), 1500);
    },

    update: function(url) {
        $.ajax({
            url: url,
            dataType: 'json',
            cache: false,
            success: function (data) {
                var s = {};
                s[url.replace(/\//g,'')] = data;
                this.setState(s);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

    },

    flushCache: function() {
        $.ajax({url: this.props.cacheUrl, type: 'DELETE', complete: this.updateCacheData});
    },

    autosettingChanged: function(ev) {
        this.setState({autoupdating: ev.target.checked});
    },

    toggleHelp: function(ev) {
        this.setState({statusShowing: ! this.state.statusShowing});
    },


    render: function() {

        if (this.state.statusShowing) {
            var mainView = ( <div key={1}>
                <CacheStats data={this.state.cache}/>
                <button onClick={this.flushCache} className="pure-button">Flush cache</button>
                <br/>
                <label htmlFor="cb" className="pure-checkbox" style={{float:'right'}}>
                    <input
                        id="cb"
                        type="checkbox"
                        defaultChecked={this.state.autoupdating}
                        onChange={this.autosettingChanged}/>Automatically update
                </label><CacheEntries data={this.state.cache.contents} />
            </div>);
        } else {
            var mainView = (<HelpBox key={11}/>);
        }

        return (
            <div style={{padding: '10px'}}>
                <button style={{float: 'right'}} onClick={this.toggleHelp} className="pure-button">{this.state.statusShowing ? 'Client configuration' : 'Cache status'}</button>
                <h1>Transparent HTTP/HTTPS proxy</h1>
                <h3>Caching requests for {this.state.meta.target}</h3>
                <ReactCSSTransitionGroup transitionLeave={false} transitionName="main">
                    {mainView}
                </ReactCSSTransitionGroup>
                <hr/>
                <span style={{float: 'right'}}>Time-to-live: {this.state.meta.ttl} s; Maximum cache size: {this.state.meta.maxSize} </span>
                <span>{this.state.meta.applicationName}, version {this.state.meta.applicationVersion}</span>

            </div>
        );
    }
});


React.render(<Main cacheUrl={"/cache"} metaUrl={"/meta"} />, document.getElementById('react0'));