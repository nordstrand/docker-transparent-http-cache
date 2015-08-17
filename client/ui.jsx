var Table = Reactable.Table;

var CacheEntries = React.createClass({
    render: function() {
        return this.props.data.length ?
        <Table
            sortable={true}
            filterable={['url']}
            columns={[{key: 'url', label: 'URL'},
            {key: 'contenttype', label: 'Content-type'},
            {key: 'expires', label: 'Expires by'},
            {key: 'size', label: 'Size'}]}
            className="pure-table pure-table-striped"
            itemsPerPage={100}
            data={this.props.data}
        /> : <p style={{fontStyle: 'italic'}}>Cache is empty</p>;


    }
});

var CacheStats = React.createClass({
    render: function() {
        return (
            <dl>
                <dt>Cache entries</dt>
                <dd>{this.props.data.contents.length}</dd>
                <dt>Cache size</dt>
                <dd>{this.props.data.contents.reduce(function (previousValue, currentValue) {
                    return previousValue + currentValue.size;
                    }, 0)}&nbsp;b</dd>
                <dt>V8 heap usage</dt>
                <dd>{this.props.data.heapUsage}&nbsp;b</dd>
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
            autoupdating: true};
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
        $.ajax({url: this.props.url, type: 'DELETE', complete: this.updateCacheData});
    },

    autosettingChanged: function(ev) {
        this.setState({autoupdating: ev.target.checked});
    },

    render: function() {
        return (
            <div style={{padding: '10px'}}>
                <h1>Transparent HTTP/HTTPS proxy</h1>
                <h3>Caching requests for {this.state.meta.target}</h3>
                <CacheStats data={this.state.cache}/>
                <button onClick={this.flushCache} className="pure-button">Flush cache</button>
                <br/>
                <label for="cb" className="pure-checkbox" style={{float:'right'}}>
                <input
                    id="cb"
                    type="checkbox"
                    defaultChecked={this.state.autoupdating}
                    onChange={this.autosettingChanged}/>Automatically update
                </label>
                <CacheEntries data={this.state.cache.contents} />
                <hr/>
                <span style={{float: 'right'}}>Time-to-live: {this.state.meta.ttl} s</span>
                <span>{this.state.meta.applicationName}, version {this.state.meta.applicationVersion}</span>

            </div>
        );
    }
});


React.render(<Main cacheUrl={"/cache"} metaUrl={"/meta"} />, document.getElementById('react0'));