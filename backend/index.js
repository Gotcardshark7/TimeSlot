require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { db, ready } = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const requiredFields = [
  'client_name',
  'client_email',
  'service_name',
  'appointment_date',
  'appointment_time',
];

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/appointments', (req, res) => {
  db.all(
    'SELECT * FROM appointments ORDER BY appointment_date, appointment_time',
    (error, appointments) => {
      if (error) {
        console.error('Error loading appointments:', error);
        res.status(500).json({ error: 'No se pudieron cargar las citas.' });
        return;
      }

      res.json(appointments);
    }
  );
});

app.put('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body || {};
  const appointmentId = Number(req.params.id);
  const validStatuses = ['completed', 'cancelled', 'pending'];

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    res.status(400).json({ error: 'El ID de la cita debe ser un entero positivo.' });
    return;
  }

  if (!validStatuses.includes(status)) {
    res.status(400).json({
      error: `El estado debe ser uno de los siguientes: ${validStatuses.join(', ')}.`,
    });
    return;
  }

  db.run(
    'UPDATE appointments SET status = ? WHERE id = ?',
    [status, appointmentId],
    function (updateError) {
      if (updateError) {
        console.error('Error updating appointment status:', updateError);
        res.status(500).json({ error: 'No se pudo actualizar el estado de la cita.' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'No se encontró la cita.' });
        return;
      }

      db.get(
        'SELECT * FROM appointments WHERE id = ?',
        [appointmentId],
        (selectError, updatedAppointment) => {
          if (selectError) {
            console.error('Error loading updated appointment:', selectError);
            res.status(500).json({ error: 'El estado se actualizó, pero no se pudo cargar la cita.' });
            return;
          }

          res.json(updatedAppointment);
        }
      );
    }
  );
});

app.post('/api/appointments', (req, res) => {
  const appointment = req.body;

  if (
    !appointment ||
    typeof appointment !== 'object' ||
    Array.isArray(appointment)
  ) {
    res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un objeto JSON.' });
    return;
  }

  const hasMissingField = requiredFields.some(
    (field) =>
      typeof appointment[field] !== 'string' ||
      appointment[field].trim().length === 0
  );

  if (hasMissingField) {
    res.status(400).json({
      error: `Se requieren los campos: ${requiredFields.join(', ')}.`,
    });
    return;
  }

  db.get(
    `SELECT id FROM appointments
     WHERE appointment_date = ? AND appointment_time = ?`,
    [appointment.appointment_date, appointment.appointment_time],
    (lookupError, existingAppointment) => {
      if (lookupError) {
        console.error('Error checking appointment availability:', lookupError);
        res.status(500).json({ error: 'No se pudo verificar la disponibilidad.' });
        return;
      }

      if (existingAppointment) {
        res.status(409).json({ error: 'Ese horario ya está ocupado.' });
        return;
      }

      db.run(
        `INSERT INTO appointments (
          client_name,
          client_email,
          service_name,
          appointment_date,
          appointment_time
        ) VALUES (?, ?, ?, ?, ?)`,
        requiredFields.map((field) => appointment[field].trim()),
        function (insertError) {
          if (insertError) {
            if (insertError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              res.status(409).json({ error: 'Ese horario ya está ocupado.' });
              return;
            }

            console.error('Error creating appointment:', insertError);
            res.status(500).json({ error: 'No se pudo crear la cita.' });
            return;
          }

          db.get(
            'SELECT * FROM appointments WHERE id = ?',
            [this.lastID],
            (selectError, createdAppointment) => {
              if (selectError) {
                console.error('Error loading created appointment:', selectError);
                res.status(500).json({ error: 'La cita se creó, pero no se pudo cargar.' });
                return;
              }

              res.status(201).json(createdAppointment);
            }
          );
        }
      );
    }
  );
});

ready
  .then(() => {
    app.listen(port, () => {
      console.log(`TimeSlot backend escuchando en el puerto ${port}`);
    });
  })
  .catch((error) => {
    console.error('No se pudo inicializar la base de datos:', error);
    process.exitCode = 1;
  });
