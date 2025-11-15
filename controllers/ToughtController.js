const { raw } = require('express')
const Tought = require('../models/Tought')
const User = require('../models/User')

const { Op } = require('sequelize')

module.exports = class ToughtController {
   static showToughts(req, res) {
    console.log(req.query)

    // check if user is searching
    let search = ''

    if (req.query.search) {
      search = req.query.search
    }

    // order results, newest first
    let order = 'DESC'

    if (req.query.order === 'old') {
      order = 'ASC'
    } else {
      order = 'DESC'
    }

    Tought.findAll({
      include: User,
      where: {
        title: { [Op.like]: `%${search}%` },
      },
      order: [['createdAt', order]],
    })
      .then((data) => {
        let toughtsQty = data.length

        if (toughtsQty === 0) {
          toughtsQty = false
        }

        const toughts = data.map((result) => result.get({ plain: true }))

        res.render('toughts/home', { toughts, toughtsQty, search })
      })
      .catch((err) => console.log(err))
  }

    static async dashboard(req, res){
        const userid = req.session.userid

        const user = await User.findOne({
            where: {
                id: userid,
            },
            include: Tought,
            plain: true,
        })

        if(!user) {
            res.redirect('/login')
        }

        const toughts = user.Toughts.map((result) => result.dataValues) 
        
        let emptyToughts = false

        if (toughts.length === 0) {
            emptyToughts = true
        }

        res.render('toughts/dashboard', {toughts})
    }

    static createTought(req, res){
        res.render('toughts/create')
    }

    static async createToughtSave(req, res){        
        const tought = {
            title: req.body.title,
            UserId: req.session.userid
        }

        try
        {
            await Tought.create(tought)
            req.flash('message', 'Pensamento criado com sucesso!')

            req.session.save(() => {
                res.redirect('/toughts/dashboard')
            })            
        } catch (error){
            console.log('Aconteceu um grande erro:' + error)
        }
    }

    static async removeTought(req, res) {
        const id = req.body.id
        const UserId = req.session.userid

        try{
            await Tought.destroy({where: {id: id, UserId: UserId}})

            req.flash('message', 'Pensamento removido com sucesso')

            req.session.save(() => {
                res.redirect('/toughts/dashboard')
            })            
        } catch (error) {
            console.log('Aconteceu um erro:' + error)
        }
    }

    static updateTought(req, res) {
    const id = req.params.id

    Tought.findOne({ where: { id: id }, raw: true })
      .then((tought) => {
        res.render('toughts/edit', { tought })
      })
      .catch((err) => console.log())
  }

  static updateToughtPost(req, res) {
    const id = req.body.id

    const tought = {
      title: req.body.title,
      description: req.body.description,
    }

    Tought.update(tought, { where: { id: id } })
      .then(() => {
        req.flash('message', 'Pensamento atualizado com sucesso!')
        req.session.save(() => {
          res.redirect('/toughts/dashboard')
        })
      })
      .catch((err) => console.log())
  }
}

 