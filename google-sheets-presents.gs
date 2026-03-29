const SHEET_NAME = 'Presents';
const ADMIN_TOKEN = 'CHANGE_ME_STRONG_TOKEN';

function doGet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ error: `Sheet ${SHEET_NAME} not found` }, 404);
  }

  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return jsonResponse({ products: [] });
  }

  const header = rows.shift().map((h) => String(h).trim().toLowerCase());
  const products = rows
    .map((row, index) => mapRow(header, row, index))
    .filter((p) => p.enabled)
    .map((p) => withProgress(p));

  return jsonResponse({ products: products, mbwayNumber: getMbWayNumber_() });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    if (payload.token !== ADMIN_TOKEN) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const id = String(payload.id || '').trim();
    const amount = Number(payload.amount || 0);
    if (!id || !Number.isFinite(amount) || amount <= 0) {
      return jsonResponse({ error: 'Invalid id or amount' }, 400);
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ error: `Sheet ${SHEET_NAME} not found` }, 404);
    }

    const rows = sheet.getDataRange().getValues();
    const header = rows[0].map((h) => String(h).trim().toLowerCase());
    const idCol = header.indexOf('id');
    const currentCol = header.indexOf('current');

    if (idCol === -1 || currentCol === -1) {
      return jsonResponse({ error: 'Sheet must contain id and current columns' }, 400);
    }

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][idCol]).trim() === id) {
        const oldValue = Number(rows[i][currentCol] || 0);
        const newValue = oldValue + amount;
        sheet.getRange(i + 1, currentCol + 1).setValue(newValue);
        return jsonResponse({ ok: true, id: id, current: newValue });
      }
    }

    return jsonResponse({ error: 'Product id not found' }, 404);
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
}

function mapRow(header, row, index) {
  const get = (name) => {
    const pos = header.indexOf(name);
    return pos >= 0 ? row[pos] : '';
  };

  return {
    id: String(get('id') || index + 1),
    name: String(get('name') || `Presente ${index + 1}`),
    target: Number(get('target') || 0),
    current: Number(get('current') || 0),
    image: String(get('image') || ''),
    emoji: String(get('emoji') || '🎁'),
    enabled: String(get('enabled') || 'TRUE').toUpperCase() !== 'FALSE',
    paid: String(get('paid') || '').toUpperCase() === 'TRUE'
  };
}

function withProgress(product) {
  const target = product.target > 0 ? product.target : 1;
  const autoPaid = product.current >= target && product.target > 0;
  const paid = Boolean(product.paid) || autoPaid;
  const progress = paid ? 100 : Math.max(0, Math.min(100, Math.round((product.current / target) * 100)));

  return {
    id: product.id,
    name: product.name,
    target: product.target,
    current: product.current,
    image: product.image,
    emoji: product.emoji,
    paid: paid,
    progress: progress
  };
}

function getMbWayNumber_() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty('MBWAY_NUMBER') || '';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/*
Sheet headers (first row):
id | name | target | current | image | emoji | enabled | paid

Example:
coffee_machine | Máquina de café | 120 | 45 | img/cafe.jpg | ☕ | TRUE | FALSE

Setup:
1) Deploy as Web app (Anyone with the link).
2) Set Script Properties:
   - MBWAY_NUMBER: 9XXXXXXXX
3) Optional: keep doPost for admin increments with ADMIN_TOKEN.
*/
