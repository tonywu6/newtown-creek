// index.ts
// Copyright (C) 2021  Tony Wu +https://github.com/tonywu7/
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as main from './scripts/main'
import * as map from './scripts/map'
import * as tm2 from './scripts/apps/theory-making-2'

import './styles/index.scss'
import './styles/apps/theory-making-2.scss'

window.addEventListener('DOMContentLoaded', async () => {
    main.init()
    map.init()
    tm2.init()
})
