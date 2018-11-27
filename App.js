Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    items: [
        {
            xtype: 'container',
            layout: 'fit',
            itemId: 'headerContainer',
            height: 40
        },
        {
            xtype: 'container',
            layout: 'fit',
            itemId: 'gridContainer',
            flex: 1
        }
    ],

    launch: function() {
        this._loadTypes().then({
            success: this._loadTemplatePreferences,
            scope: this
        }).then({
            success: this._bucketPrefsTogether,
            scope: this
        }).then({
            success: this._addGrid,
            scope: this
        });
    },

    _loadTypes: function() {
        return Ext.create('Rally.data.wsapi.Store',{
            model: 'TypeDefinition',
            sorters: [
                {
                    property: 'Name'
                }
            ],
            fetch: ['DisplayName', 'ElementName', 'TypePath', 'Parent', 'Name'],
            filters: [
                {
                    property: 'Creatable',
                    value: true
                }
            ],
            autoLoad: false,
            remoteSort: false,
            remoteFilter: true
        }).load();
    },

    _loadTemplatePreferences: function(records) {
        this.types = _.pluck(_.filter(_.pluck(records, 'raw'), function(record) {
            return _.contains(['SchedulableArtifact', 'PortfolioItem', 'Requirement', 'Artifact'], record.Parent.ElementName);
        }), 'TypePath');

        var filters = [
            {
                property: 'Name',
                operator: 'contains',
                value: 'rich-text-templates-'
            },
            Rally.data.wsapi.Filter.or([
                {
                    property: 'Workspace',
                    value: this.getContext().getWorkspaceRef()
                },
                {
                    property: 'Project',
                    value: this.getContext().getProjectRef()
                },
                {
                    property: 'User',
                    value: Rally.util.Ref.getRelativeUri(this.getContext().getUser())
                }
            ])
        ];

        var store = Ext.create('Rally.data.wsapi.Store', {
            model: 'Preference',
            filters: filters,
            sorters: [
                { property: 'Name', direction: 'ASC' }
            ],
            pageSize: 2000,
            limit: Infinity,
            fetch: [ 'Name', 'Type', 'Value', 'Project', 'User', 'Workspace', 'CreationDate'],
            context: {
                workspace: this.getContext().getWorkspaceRef(),
                project: null
            }
        });

        return store.load();
    },

    _bucketPrefsTogether: function(records) {
        this.preferenceModel = records && records.length && records[0].self;
        this.preferenceModel.addField({ name: 'DefaultFor'});
        var bucket = {};  //charlie?
        var defaults = {};
        var id, tokens;
        _.each(records, function(record) {
            var name = record.get('Name');
            if (name.indexOf('rich-text-templates-template-') === 0) {
                tokens = name.split('-');
                id = tokens[4];
                bucket[id] = bucket[id] || {};
                if (tokens[5] === 'name') {
                    bucket[id].Name = record.get('Value');
                } else if (tokens[5] === 'value') {
                    delete record.raw.Name;
                    Ext.apply(bucket[id], record.raw);
                }
                if (defaults[id]) {
                    bucket[id].DefaultFor = defaults[id];
                }
            } else if(name.indexOf('rich-text-templates-default') === 0) {
                id = record.get('Value');
                tokens = record.get('Name').split('-');
                
                var existingDefault = defaults[id];
                if (existingDefault) {
                    existingDefault += ',\r\n';
                } else {
                    existingDefault = '';
                }
                defaults[id] = existingDefault + Ext.String.capitalize((tokens[tokens.length - 2] + '.' + tokens[tokens.length - 1]).replace('hierarchicalrequirement', 'story'));
            }
        });

        return _.values(bucket);
    },

    _addGrid: function(records) {
        this.down('#headerContainer').add({
            xtype: 'rallyaddnew',
            recordTypes: this.types,
            disableAddButton: true
        });
        this.down('#gridContainer').add({
            xtype: 'rallygrid',
            columnCfgs: [
                'Name',
                'Value',
                {
                    dataIndex: 'DefaultFor',
                    text: 'Default For'
                },
                'Project',
                'User',
                'Workspace'
            ],
            viewConfig: {
                enableTextSelection: true
            },
            context: this.getContext(),
            enableEditing: false,
            showRowActionsColumn: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: records,
                model: this.preferenceModel
            }),
        });
    }

    //TODO: Add copy to clipboard menu action
    //TODO: Disable edit/delete menu actions
    //TODO: Render a default for column
});
