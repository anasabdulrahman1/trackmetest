ALTER TABLE devices
ADD CONSTRAINT devices_user_id_key UNIQUE (user_id);
