var widgetId = Fliplet.Widget.getDefaultId();
var data = Fliplet.Widget.getData() || {};
var $dataSource = $('select[name="dataSource"]');
var organizationId = Fliplet.Env.get('organizationId');

var $imagesContainer = $('.image-library');
var templates = {
  folder: template('folder'),
  app: template('app'),
  organization: template('organization'),
  noFiles: template('nofiles')
};

function addFolder(folder) {
  $imagesContainer.append(templates.folder(folder));
}

function addApp(app) {
  $imagesContainer.append(templates.app(app));
}

function addOrganization(organization) {
  $imagesContainer.append(templates.organization(organization));
}

function noFiles() {
  $imagesContainer.html(templates.noFiles());
}

function template(name) {
  return Handlebars.compile($('#template-' + name).html());
}

var upTo = [{ back: openRoot, name: 'Root'}];
var folders,
    apps,
    organizations;

function getApps() {
  return Fliplet.Apps
    .get()
    .then(function (apps) {
      return apps.filter(function (app) {
        return !app.legacy;
      });
    });
}

function openRoot() {
  // Clean library container
  $imagesContainer.html('');

  // Update paths
  updatePaths();

  var organizationId = Fliplet.Env.get('organizationId');
  return Promise.all([
    Fliplet.Organizations.get(),
    getApps()
  ])
    .then(function renderRoot(values) {
      organizations = values[0];
      apps = values[1];

      values[0].forEach(addOrganization);
      values[1].forEach(addApp);
    });
}

function openFolder(folderId) {
  Fliplet.Media.Folders.get({ type: 'folders', folderId: folderId })
    .then(renderFolderContent);
}

function openApp(appId) {
  Fliplet.Media.Folders.get({ type: 'folders', appId: appId })
    .then(renderFolderContent);
}

function openOrganization(organizationId) {
  Fliplet.Media.Folders.get({ type: 'folders', organizationId: organizationId })
    .then(renderFolderContent);
}

function renderFolderContent(values) {
  $('.folder-selection span').html('Select an folder below');
  $imagesContainer.html('');

  if (!values.folders.length) {
    return noFiles();
  }

  folders = values.folders;

  // Render folders and files
  _.sortBy(values.folders, ['name']).forEach(addFolder);
}

function updatePaths() {
  if (upTo.length === 1) {
    // Hide them
    $('.back-btn').hide();
    $('.breadcrumbs-select').hide();

    return;
  }

  // Show them
  $('.breadcrumbs-select').show();
  $('.back-btn').show();

  // Parent folder
  $('.up-to').html(upTo[upTo.length - 2].name);

  // Current folder
  $('.helper strong').html(upTo[upTo.length - 1].name);
}

function reloadDataSources(dataSourceId) {
  return Fliplet.DataSources.get({
    type: null
  }, {
    cache: false
  }).then(function(results) {
    allDataSources = results;
    $dataSource.html('<option value="none">-- Select a data source</option><option disabled>------</option><option value="new">Create a new data source</option><option disabled>------</option>');
    allDataSources.forEach(function (d) {
      $dataSource.append('<option value="' + d.id + '">' + d.name + '</option>');
    });

    if (dataSourceId) {
      $dataSource.val(dataSourceId);
    }
    $dataSource.trigger('change');
  });
}

function createDataSource() {
  var name = prompt('Please type a name for your data source:');

  if (name === null) {
    $dataSource.val('none').trigger('change');
    return;
  }

  if (name === '') {
    $dataSource.val('none').trigger('change');
    alert('You must enter a data source name');
    return;
  }

  Fliplet.DataSources.create({
    name: name, organizationId:
    organizationId
  }).then(function (d) {
    $dataSource.append('<option value="' + d.id + '">' + d.name + '</option>');
    $dataSource.val(d.id);
  });
};

// init
openRoot();

Fliplet.DataSources.get({
  organizationId: organizationId
}).then(function (dataSources) {
  dataSources.forEach(function (d) {
    $dataSource.append('<option value="' + d.id + '">' + d.name + '</option>');
  });

  if (data.dataSourceId) {
    $dataSource.val(data.dataSourceId);
  }
});

$('.image-library')
  .on('dblclick', '[data-folder-id]', function () {
    var $el = $(this);
    var id = $el.data('folder-id');
    var backItem;

    // Store to nav stack
    backItem = _.find(folders, ['id', id]);
    backItem.back = function () {
      openFolder(id);
    };
    upTo.push(backItem);

    // Open
    openFolder(id);

    // Update paths
    updatePaths();
  })
  .on('dblclick', '[data-app-id]', function () {
    var $el = $(this);
    var id = $el.data('app-id');
    var backItem;

    // Store to nav stack
    backItem = _.find(apps, ['id', id]);
    backItem.back = function () {
      openApp(id);
    };
    upTo.push(backItem);

    // Open
    openApp(id);

    // Update paths
    updatePaths();
  })
  .on('dblclick', '[data-organization-id]', function () {
    var $el = $(this);
    var id = $el.data('organization-id');
    var backItem;

    // Store to nav stack
    backItem = _.find(organizations, ['id', id]);
    backItem.back = function () {
      openOrganization(id);
    };
    upTo.push(backItem);

    // Open
    openOrganization(id);

    // Update paths
    updatePaths();

  })
  .on('click', '[data-folder-id]', function () {
    var $el = $(this);
    // Removes any selected folder
    $('.folder').not(this).each(function(){
      $(this).removeClass('selected');
    });

    if ($el.hasClass('selected')) {
      $('.folder-selection span').html('Select a folder below');
      data.folder = {};
    } else {
      $('.folder-selection span').html('You have selected a folder');
      data.folder = { folderId: $el.data('folder-id') };
    }

    $el.toggleClass('selected');
  })
  .on('click', '[data-app-id]', function () {
    var $el = $(this);
    // Removes any selected folder
    $('.folder').not(this).each(function(){
      $(this).removeClass('selected');
    });

    if ($el.hasClass('selected')) {
      $('.folder-selection span').html('Select a folder below');
      data.folder = {};
    } else {
      $('.folder-selection span').html('You have selected a folder');
      data.folder = { appId: $el.data('app-id') };
    }

    $el.toggleClass('selected');
  })
  .on('click', '[data-organization-id]', function () {
    var $el = $(this);
    // Removes any selected folder
    $('.folder').not(this).each(function(){
      $(this).removeClass('selected');
    });

    if ($el.hasClass('selected')) {
      $('.folder-selection span').html('Select a folder below');
      data.folder = {};
    } else {
      $('.folder-selection span').html('You have selected a folder');
      data.folder = { organizationId: $el.data('organization-id') };
    }

    $el.toggleClass('selected');
  });

$('.back-btn').click(function () {
  if (upTo.length === 1) {
    return;
  }

  upTo.pop();
  upTo[upTo.length-1].back();
  updatePaths();
});

$('#manage-data').on('click', function() {
  var dataSourceId = $dataSource.val();
  Fliplet.Studio.emit('overlay', {
    name: 'widget',
    options: {
      size: 'large',
      package: 'com.fliplet.data-sources',
      title: 'Edit Data Sources',
      classes: 'data-source-overlay',
      data: {
        context: 'overlay',
        dataSourceId: dataSourceId
      }
    }
  });
});

$dataSource.on( 'change', function() {
  var selectedDataSourceId = $(this).val();
  if (selectedDataSourceId && selectedDataSourceId !== 'none' && selectedDataSourceId !== 'new') {
    $('#manage-data').removeClass('hidden');
  } else {
    $('#manage-data').addClass('hidden');
  }

  if (selectedDataSourceId === 'new') {
    createDataSource();
  }
});

Fliplet.Studio.onMessage(function(event) {
  if (event.data && event.data.event === 'overlay-close') {
    reloadDataSources(event.data.data.dataSourceId);
  }
});

// 1. Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  $('form').submit();
});

// 2. Fired when the user submits the form
$('form').submit(function (event) {
  event.preventDefault();
  var email = $('#report_email').val();
  emailValidate(email);
});

function emailValidate(email) {
  var pattern = new RegExp(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/);
  // Allows saving empty
  if (email === "") {
    $('#report_email').parents('.form-group').removeClass('has-error');
    save(true);
  } else {
    if (pattern.test(email)) {
      $('#report_email').parents('.form-group').removeClass('has-error');
      save(true);
    } else {
      $('#report_email').parents('.form-group').addClass('has-error');
      $('#report_email').trigger('focus');
      return;
    }
  }
}

function save(notifyComplete) {
  data.reportEmail = $('#report_email').val();
  data.dataSourceId = $dataSource.val();

  Fliplet.Widget.save(data).then(function () {
    if (notifyComplete) {
      Fliplet.Widget.complete();
      window.location.reload();
    } else {
      Fliplet.Studio.emit('reload-widget-instance', widgetId);
    }
  });
}

$('#help_tip').on('click', function() {
  alert("During beta, please use live chat and let us know what you need help with.");
});
