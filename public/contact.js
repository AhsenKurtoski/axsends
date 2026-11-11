(function () {
  var form = document.getElementById('contact-form')
  if (!form) return

  var status = document.getElementById('form-status')
  var button = form.querySelector('button[type="submit"]')
  if (!status || !button) return

  function setStatus(message, state) {
    status.textContent = message
    if (state) {
      status.setAttribute('data-state', state)
    } else {
      status.removeAttribute('data-state')
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault()

    if (!form.reportValidity()) return

    var data = new FormData(form)
    var payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      organisation: String(data.get('organisation') || '').trim(),
      message: String(data.get('message') || '').trim(),
      consent: data.get('consent') === 'on',
      locale: 'en',
      website: String(data.get('website') || '').trim(),
    }

    var oldLabel = button.textContent
    button.disabled = true
    button.textContent = 'Sending…'
    setStatus('', '')

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return null
          })
          .then(function (body) {
            return { response: response, body: body }
          })
      })
      .then(function (result) {
        var response = result.response

        if (!response.ok) {
          if (response.status === 400) {
            throw new Error('Please check the fields: name, email, message and consent are required.')
          }
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a minute and try again.')
          }
          if (response.status === 503) {
            throw new Error(
              'The form is temporarily unavailable. Please use the email link in the contact panel.'
            )
          }
          throw new Error(
            'Sending failed. Please try again or use the email link in the contact panel.'
          )
        }

        form.reset()
        setStatus(
          'Request sent. Thank you — we will reply to the email address you provided.',
          'success'
        )
      })
      .catch(function (error) {
        setStatus(
          error instanceof Error
            ? error.message
            : 'Sending failed. Please use the email link in the contact panel.',
          'error'
        )
      })
      .finally(function () {
        button.disabled = false
        button.textContent = oldLabel
      })
  })
})()
